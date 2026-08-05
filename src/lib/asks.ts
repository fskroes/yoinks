import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const ASKS_FILE = path.join(os.homedir(), '.config', 'yoinks', 'asks.jsonl')

/**
 * One turn, written down so it can be counted later
 * (docs/adr/0009-the-ask-log-is-evidence.md).
 *
 * What it holds: the question a person typed, the source it was asked of, and
 * how the gate went — how many receipts survived and how many were dropped.
 *
 * What it does not hold, ever: the gist, the receipts, or any other words the
 * source said. An expansion carries the second it was asked about rather than
 * the receipt it came from, for the same reason — a time is a pointer, a
 * receipt is content (`docs/product-thesis.md`, Constraint 4).
 */
export type Asked =
  | {kind: 'question'; question: string}
  /** `second` is where in the source the receipt sat, not what it said */
  | {kind: 'expansion'; second: number}

export type Ask = {
  /** ISO 8601, when the answer landed */
  at: string
  url: string
  /** the source's own title, or the url when the platform publishes none */
  title: string
  /** receipts that survived the gate — 0 means no answer was shown */
  receipts: number
  /** receipts the gate dropped (ADR 0005) */
  dropped: number
} & Asked

/** One JSON object per line, so `jq` and a shell are enough to read it. */
export function askLine(ask: Ask): string {
  return `${JSON.stringify(ask)}\n`
}

export function logAsk(ask: Ask): void {
  try {
    fs.mkdirSync(path.dirname(ASKS_FILE), {recursive: true})
    fs.appendFileSync(ASKS_FILE, askLine(ask))
  } catch {
    // the log is a nicety — never let it break an answer
  }
}

/** Every ask, oldest first. Broken lines are skipped rather than throwing. */
export function loadAsks(): Ask[] {
  try {
    return fs
      .readFileSync(ASKS_FILE, 'utf8')
      .split('\n')
      .filter(Boolean)
      .flatMap(line => {
        try {
          return [JSON.parse(line) as Ask]
        } catch {
          return []
        }
      })
  } catch {
    return []
  }
}
