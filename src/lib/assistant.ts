/**
 * Answering drives an assistant already on the person's PATH (ADR 0002).
 *
 * Yoinks does not call a model, holds no API key, and has no billing
 * relationship with anyone. This is the same pattern as finding yt-dlp, ffmpeg
 * and whisper.cpp — and the same mechanism the only surviving product evidence
 * was generated with: the two useful sessions in
 * `docs/validation/step-2-cold-start.md` were both answered by an assistant
 * holding the full transcript, driven by hand.
 *
 * A follow-up resumes the assistant's own session (ADR 0006): the first turn
 * returns a conversation handle, later turns send only themselves. The record
 * behind that handle is the assistant's, not Yoinks' — Yoinks drops the handle
 * when the person leaves the source.
 */

import {spawn} from 'node:child_process'
import {commandWorks} from './command.js'

/** What one exchange comes back as: the answer text, and the handle that lets the next turn continue the conversation. */
export type Turn = {
  text: string
  conversation: string
}

export type Assistant = {
  name: string
  command: string
  /** How this CLI is asked a first question and made to answer without a terminal. The prompt itself travels on stdin — see `ask`. */
  argsFor: () => string[]
  /** How this CLI is asked a follow-up inside an existing conversation. */
  resumeArgsFor: (conversation: string) => string[]
  /** How this CLI's machine output becomes a Turn. */
  parse: (stdout: string) => Turn
  /**
   * How one line of this CLI's output becomes a piece of the answer's text as
   * it arrives, or nothing. Claude streams true text deltas; codex emits each
   * message whole, so its delta is the full message plus the newline that
   * completes its last line.
   */
  delta: (line: string) => string | undefined
}

/**
 * In preference order. Every invocation here has been run against the real CLI
 * — a guessed flag fails at the worst possible moment, after someone has
 * already waited for a transcript. Verified quirks worth knowing: claude
 * resumes a session only from the directory it was started in (Yoinks never
 * changes directory, so this holds), and codex refuses to run outside a
 * trusted directory unless the git check is skipped.
 */
const CLAUDE_STREAM_FORM = ['--output-format', 'stream-json', '--include-partial-messages', '--verbose']

export const KNOWN: Assistant[] = [
  {
    name: 'Claude Code',
    command: 'claude',
    argsFor: () => ['-p', ...CLAUDE_STREAM_FORM],
    resumeArgsFor: conversation => ['-p', '--resume', conversation, ...CLAUDE_STREAM_FORM],
    // The stream ends with one `result` line carrying the whole answer — the
    // same shape `--output-format json` used to emit on its own.
    parse: stdout => {
      for (const line of stdout.split('\n')) {
        const event = parseLine(line) as {type?: string; result?: string; session_id?: string}
        if (event?.type !== 'result') continue
        if (typeof event.result !== 'string' || !event.session_id) break
        return {text: event.result, conversation: event.session_id}
      }
      throw new Error('Claude Code replied in a shape Yoinks does not recognise.')
    },
    delta: line => {
      const event = parseLine(line) as
        | {type?: string; event?: {type?: string; delta?: {type?: string; text?: string}}}
        | undefined
      if (event?.type !== 'stream_event' || event.event?.delta?.type !== 'text_delta') return undefined
      return event.event.delta.text
    },
  },
  {
    name: 'Codex',
    command: 'codex',
    argsFor: () => ['exec', '--json', '--skip-git-repo-check', '-'],
    resumeArgsFor: conversation => ['exec', 'resume', conversation, '-', '--json', '--skip-git-repo-check'],
    parse: stdout => {
      let conversation = ''
      const texts: string[] = []
      for (const line of stdout.split('\n')) {
        const event = parseLine(line) as
          | {type?: string; thread_id?: string; item?: {type?: string; text?: string}}
          | undefined
        if (!event) continue
        if (event.type === 'thread.started' && event.thread_id) conversation = event.thread_id
        if (event.item?.type === 'agent_message' && event.item.text) texts.push(event.item.text)
      }
      if (!conversation || !texts.length) {
        throw new Error('Codex replied in a shape Yoinks does not recognise.')
      }
      return {text: texts.join('\n'), conversation}
    },
    delta: line => {
      const event = parseLine(line) as {item?: {type?: string; text?: string}} | undefined
      if (event?.item?.type !== 'agent_message' || !event.item.text) return undefined
      return `${event.item.text}\n`
    },
  },
]

/** One JSONL line to its event, or nothing for blanks and non-JSON chatter. */
function parseLine(line: string): unknown {
  if (!line.trim()) return undefined
  try {
    return JSON.parse(line)
  } catch {
    return undefined
  }
}

export async function findAssistant(): Promise<Assistant> {
  for (const assistant of KNOWN) {
    if (await commandWorks(assistant.command, ['--version'])) return assistant
  }
  throw new Error(
    'Answering needs an assistant on your PATH — install one with “npm i -g @anthropic-ai/claude-code” and try again.',
  )
}

/**
 * Hand the assistant the prompt and take back the turn. Pass the conversation
 * from a previous turn to continue it instead of starting over.
 *
 * The prompt travels on stdin — claude reads it with no positional argument,
 * codex when the prompt argument is `-` (both verified live, first turn and
 * resume). Arguments carry only flags and the conversation handle, so no
 * transcript can hit the OS argument-size limit however long the source runs.
 */
export function ask(
  assistant: Assistant,
  prompt: string,
  opts?: {conversation?: string; signal?: AbortSignal; onDelta?: (text: string) => void},
): Promise<Turn> {
  return new Promise((resolve, reject) => {
    const args = opts?.conversation ? assistant.resumeArgsFor(opts.conversation) : assistant.argsFor()
    const child = spawn(assistant.command, args, {signal: opts?.signal, stdio: ['pipe', 'pipe', 'pipe']})

    let stdout = ''
    let stderr = ''
    // Decode as text before splitting, so a multibyte character straddling
    // two chunks cannot corrupt the line it lands in.
    child.stdout.setEncoding('utf8')
    // The assistant's output is JSONL, so a line is the unit a delta can be
    // read from — `pending` holds the partial line between chunks.
    let pending = ''
    child.stdout.on('data', chunk => {
      stdout += chunk
      if (!opts?.onDelta) return
      const lines = (pending + chunk).split('\n')
      pending = lines.pop()!
      for (const line of lines) {
        const text = assistant.delta(line)
        if (text) opts.onDelta(text)
      }
    })
    child.stderr.on('data', chunk => (stderr += chunk))
    child.on('error', reject)
    // EPIPE if the child dies before reading — the close handler reports that.
    child.stdin.on('error', () => {})
    child.stdin.end(prompt)
    child.on('close', code => {
      // stderr is not a failure signal here: assistants print hook, plugin and
      // telemetry chatter to it on a completely successful run. Only the exit
      // code decides.
      if (code === 0) {
        try {
          resolve(assistant.parse(stdout))
        } catch (error) {
          reject(error)
        }
        return
      }
      const last = stderr.trim().split('\n').filter(Boolean).at(-1)
      reject(new Error(last || `${assistant.name} exited with code ${code}.`))
    })
  })
}
