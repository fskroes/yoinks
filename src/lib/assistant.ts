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
  /** How this CLI is asked a first question and made to answer without a terminal. */
  argsFor: (prompt: string) => string[]
  /** How this CLI is asked a follow-up inside an existing conversation. */
  resumeArgsFor: (conversation: string, prompt: string) => string[]
  /** How this CLI's machine output becomes a Turn. */
  parse: (stdout: string) => Turn
}

/**
 * In preference order. Every invocation here has been run against the real CLI
 * — a guessed flag fails at the worst possible moment, after someone has
 * already waited for a transcript. Verified quirks worth knowing: claude
 * resumes a session only from the directory it was started in (Yoinks never
 * changes directory, so this holds), and codex refuses to run outside a
 * trusted directory unless the git check is skipped.
 */
export const KNOWN: Assistant[] = [
  {
    name: 'Claude Code',
    command: 'claude',
    argsFor: prompt => ['-p', prompt, '--output-format', 'json'],
    resumeArgsFor: (conversation, prompt) => ['-p', '--resume', conversation, prompt, '--output-format', 'json'],
    parse: stdout => {
      const reply = JSON.parse(stdout) as {result?: string; session_id?: string}
      if (typeof reply.result !== 'string' || !reply.session_id) {
        throw new Error('Claude Code replied in a shape Yoinks does not recognise.')
      }
      return {text: reply.result, conversation: reply.session_id}
    },
  },
  {
    name: 'Codex',
    command: 'codex',
    argsFor: prompt => ['exec', '--json', '--skip-git-repo-check', prompt],
    resumeArgsFor: (conversation, prompt) => ['exec', 'resume', conversation, prompt, '--json', '--skip-git-repo-check'],
    parse: stdout => {
      let conversation = ''
      const texts: string[] = []
      for (const line of stdout.split('\n')) {
        if (!line.trim()) continue
        let event
        try {
          event = JSON.parse(line) as {
            type?: string
            thread_id?: string
            item?: {type?: string; text?: string}
          }
        } catch {
          continue
        }
        if (event.type === 'thread.started' && event.thread_id) conversation = event.thread_id
        if (event.item?.type === 'agent_message' && event.item.text) texts.push(event.item.text)
      }
      if (!conversation || !texts.length) {
        throw new Error('Codex replied in a shape Yoinks does not recognise.')
      }
      return {text: texts.join('\n'), conversation}
    },
  },
]

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
 * The prompt travels as an argument rather than on stdin, because that is the
 * one form both CLIs above were verified against — stdin is left closed so a
 * CLI that reads it when piped (codex does) cannot hang waiting for more. A
 * source long enough to blow past the OS argument limit (roughly four hours of
 * speech on macOS) fails with E2BIG, which is translated below rather than
 * left as a spawn error.
 */
export function ask(
  assistant: Assistant,
  prompt: string,
  opts?: {conversation?: string; signal?: AbortSignal},
): Promise<Turn> {
  return new Promise((resolve, reject) => {
    const args = opts?.conversation
      ? assistant.resumeArgsFor(opts.conversation, prompt)
      : assistant.argsFor(prompt)
    let child
    try {
      child = spawn(assistant.command, args, {signal: opts?.signal, stdio: ['ignore', 'pipe', 'pipe']})
    } catch (error) {
      reject(tooLong(error) ?? error)
      return
    }

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => (stdout += chunk))
    child.stderr.on('data', chunk => (stderr += chunk))
    child.on('error', error => reject(tooLong(error) ?? error))
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

function tooLong(error: unknown): Error | undefined {
  return (error as {code?: string} | undefined)?.code === 'E2BIG'
    ? new Error('This source is too long to ask about in one go.')
    : undefined
}
