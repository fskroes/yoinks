/**
 * Answering drives an assistant already on the person's PATH (ADR 0002).
 *
 * Yoinks does not call a model, holds no API key, and has no billing
 * relationship with anyone. This is the same pattern as finding yt-dlp, ffmpeg
 * and whisper.cpp — and the same mechanism the only surviving product evidence
 * was generated with: the two useful sessions in
 * `docs/validation/step-2-cold-start.md` were both answered by an assistant
 * holding the full transcript, driven by hand.
 */

import {spawn} from 'node:child_process'
import {commandWorks} from './command.js'

export type Assistant = {
  name: string
  command: string
  /** How this CLI is asked one question and made to answer without a session. */
  argsFor: (prompt: string) => string[]
}

/**
 * In preference order. Every invocation here has been run against the real CLI
 * — a guessed flag fails at the worst possible moment, after someone has
 * already waited for a transcript. Adding an assistant is one line, and should
 * stay that way.
 */
const KNOWN: Assistant[] = [
  {name: 'Claude Code', command: 'claude', argsFor: prompt => ['-p', prompt]},
  {name: 'Codex', command: 'codex', argsFor: prompt => ['exec', prompt]},
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
 * Hand the assistant the prompt and take back whatever it printed.
 *
 * The prompt travels as an argument rather than on stdin, because that is the
 * one form both CLIs above were verified against. A source long enough to blow
 * past the OS argument limit (roughly four hours of speech on macOS) fails with
 * E2BIG, which is translated below rather than left as a spawn error.
 */
export function ask(assistant: Assistant, prompt: string, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    let child
    try {
      child = spawn(assistant.command, assistant.argsFor(prompt), {signal})
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
        resolve(stdout)
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
