/**
 * An answer: facts drawn from a transcript, each pointing back to where in the
 * source it came from. Shown to the person and thrown away — an answer is never
 * saved, and so is never an artifact (`CONTEXT.md`).
 *
 * Pure: a transcript and a question in, a prompt out; an assistant's reply and
 * the same blocks in, facts out. No I/O, no model, no API key — Yoinks drives
 * an assistant already on the person's PATH and holds nothing itself
 * (ADR 0002).
 *
 * The load-bearing part is {@link parseFacts}. ADR 0001 says Yoinks states
 * facts and hands the person what they need to check them; a citation pointing
 * at a time the source never recorded is the exact opposite — an invention
 * wearing a fact's clothes, and unfalsifiable at a glance because it looks
 * right. So the check is mechanical rather than aspirational: a line whose
 * timestamp is not a block this source actually has does not survive parsing.
 */

import type {Block, SkippableRegion} from './skippable.js'
import {renderTranscript, stamp} from './transcript.js'

export type Fact = {
  /** Seconds into the source — always the start of a block this source has. */
  at: number
  text: string
}

export type ParsedAnswer = {
  facts: Fact[]
  /** Lines that carried no checkable citation, kept so the cost is visible. */
  dropped: string[]
}

/** `[3:56] …` or `[1:02:03] …` — the transcript's own stamp, reused as the citation. */
const FACT = /^\[(?:(\d+):)?(\d+):(\d{2})]\s*(.+)$/

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
    '- Answer only from the transcript. If it does not answer the question, say so and stop.',
    '- Every line you write is one fact, and begins with the timestamp it came from — copied',
    '  exactly from the block it came from, in the form [m:ss]. A line without one is discarded.',
    "- Prefer the source's own words, quoted verbatim, over your own paraphrase. Quote the shortest span that carries the point — a whole paragraph back is a wall of text, which is the thing this replaces.",
    '- State what the source says. Never rate it, recommend it, or say whether it is worth watching — the person decides that.',
    '- Spans marked "skippable" are sponsor reads and sign-offs, not the source. Do not answer from them.',
    '- Give the fewest facts that answer the question, and at most 5. Do not make the same point twice in different words, and leave out what is merely nearby the subject.',
    '- No preamble, no summary, no closing line. Facts only.',
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
export function buildExpansionPrompt(fact: Fact): string {
  return [
    `Expand on this fact: [${stamp(fact.at)}] ${fact.text}`,
    '',
    'Give more facts from the transcript near that time and about its subject only.',
    'Same rules as before: every line is one fact beginning with its exact timestamp,',
    'at most 5, facts only.',
  ].join('\n')
}

export function buildFollowUpPrompt(question: string): string {
  return [
    `Question: ${question}`,
    '',
    'Answer from the same transcript, under the same rules as before.',
  ].join('\n')
}

export function parseFacts(raw: string, blocks: Block[]): ParsedAnswer {
  const recorded = new Set(blocks.map(block => block.start))
  const facts: Fact[] = []
  const dropped: string[] = []

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const hit = FACT.exec(line)
    if (!hit) {
      dropped.push(line)
      continue
    }
    const at = (hit[1] ? Number(hit[1]) * 3600 : 0) + Number(hit[2]) * 60 + Number(hit[3])
    if (!recorded.has(at)) {
      dropped.push(line)
      continue
    }
    // Order is the answer's own. Sorting by time would read as a summary of the
    // source rather than an answer to the question that was asked.
    facts.push({at, text: hit[4].trim()})
  }

  return {facts, dropped}
}
