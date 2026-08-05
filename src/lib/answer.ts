/**
 * An answer: a short gist of what the source says, backed by receipts —
 * timestamped lines pointing back to where in the source it came from
 * (ADR 0007). Shown to the person and thrown away — an answer is never saved,
 * and so is never an artifact (`CONTEXT.md`).
 *
 * Pure: a transcript and a question in, a prompt out; an assistant's reply and
 * the same blocks in, an answer out. No I/O, no model, no API key — Yoinks
 * drives an assistant already on the person's PATH and holds nothing itself
 * (ADR 0002).
 *
 * The load-bearing part is {@link parseAnswer}. A receipt pointing at a time
 * the source never recorded is an invention wearing evidence's clothes, and
 * unfalsifiable at a glance because it looks right — so the check is
 * mechanical rather than aspirational: a line whose timestamp is not a block
 * this source actually has does not survive parsing (ADR 0005). And a gist
 * with no surviving receipt behind it is not an answer at all — Yoinks never
 * shows an unbacked conclusion (ADR 0007).
 */

import type {Block, SkippableRegion} from './skippable.js'
import {renderTranscript, stamp} from './transcript.js'

export type Receipt = {
  /** Seconds into the source — always the start of a block this source has. */
  at: number
  text: string
}

export type Answer = {
  /** The assistant's own prose, at most three sentences by the prompt's rule. */
  gist: string
  receipts: Receipt[]
}

/** `[3:56] …` or `[1:02:03] …` — the transcript's own stamp, reused as the pointer. */
const RECEIPT = /^\[(?:(\d+):)?(\d+):(\d{2})]\s*(.+)$/

export function buildPrompt(opts: {
  title?: string
  url: string
  blocks: Block[]
  regions: SkippableRegion[]
  question: string
}): string {
  return [
    'Answer a question about one source, using only the transcript below.',
    '',
    'Rules:',
    '- Answer in plain prose, at most three sentences, with no timestamps in it. If the',
    '  transcript does not answer the question, say so in one sentence and write nothing else.',
    '- After the prose, back it with source lines. Each is one line beginning with the timestamp',
    '  it came from — copied exactly from the block it came from, in the form [m:ss] — followed',
    "  by the source's own words, quoted verbatim where possible. Quote the shortest span that",
    '  carries the point.',
    '- Give the fewest source lines that back the prose, and at most 5.',
    '- Write nothing before the prose and nothing after the source lines — no greeting,',
    '  no closing line.',
    '- State what the source says. Never rate it, recommend it, or say whether it is worth',
    '  watching — the person decides that.',
    '- Spans marked "skippable" are sponsor reads and sign-offs, not the source. Do not answer from them.',
    '',
    `Question: ${opts.question}`,
    '',
    'Transcript:',
    '',
    renderTranscript({title: opts.title, url: opts.url, blocks: opts.blocks, regions: opts.regions}),
  ].join('\n')
}

/**
 * Follow-ups ride the conversation (ADR 0006): the assistant already holds the
 * transcript and the rules from the first turn, so neither prompt below sends
 * them again — that saving is the whole point of resuming.
 */
export function buildExpansionPrompt(receipt: Receipt): string {
  return [
    `Say more about this: [${stamp(receipt.at)}] ${receipt.text}`,
    '',
    'Answer from the transcript near that time and about its subject only.',
    'Same rules as before: prose of at most three sentences, then at most 5',
    'source lines with their exact timestamps.',
  ].join('\n')
}

export function buildFollowUpPrompt(question: string): string {
  return [
    `Question: ${question}`,
    '',
    'Answer from the same transcript, under the same rules as before.',
  ].join('\n')
}

/**
 * The assistant's reply into an answer, or nothing. Timestamped lines become
 * receipts when their time resolves to a block this source has; everything
 * else is the gist, joined into one paragraph. No surviving receipt means no
 * answer — however confident the prose.
 */
export function parseAnswer(raw: string, blocks: Block[]): Answer | undefined {
  const recorded = new Set(blocks.map(block => block.start))
  const receipts: Receipt[] = []
  const prose: string[] = []

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const hit = RECEIPT.exec(line)
    if (!hit) {
      prose.push(line)
      continue
    }
    const at = (hit[1] ? Number(hit[1]) * 3600 : 0) + Number(hit[2]) * 60 + Number(hit[3])
    if (!recorded.has(at)) continue
    // Order is the answer's own. Sorting by time would read as a summary of
    // the source rather than backing for the gist.
    receipts.push({at, text: hit[4].trim()})
  }

  // Both halves are load-bearing: receipts without prose are not an answer
  // any more than prose without receipts — the glossary defines an answer as
  // a gist backed by receipts, and half of one is neither.
  if (!receipts.length || !prose.length) return undefined
  return {gist: prose.join(' '), receipts}
}
