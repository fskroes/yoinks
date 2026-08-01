/**
 * The transcript artifact — what actually lands in the user's Downloads.
 *
 * Pure: blocks and regions in, file contents out. No I/O.
 *
 * Every line carries the time it was said, because `CONTEXT.md` says a
 * transcript is timed and an answer that cannot be checked against the source
 * is not worth much. Where the source interrupts itself, the span is marked
 * with the verbatim phrase that gave it away, per ADR 0001 — the artifact
 * states a fact and hands the reader what they need to disagree with it. It
 * never says the span is worthless, and it never says where a subject changes
 * (ADR 0003).
 */

import type {Block, SkippableRegion} from './skippable.js'

/**
 * `[m:ss]`, or `[h:mm:ss]` past the hour — the shape the corpus was recorded in.
 *
 * Not `formatDuration` from `./format.js`, which returns the empty string for
 * anything at or below zero because a duration of zero means "unknown" there.
 * A transcript's first block is at 0:00 and has to say so.
 */
function stamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
}

function header(opts: {title?: string; url: string}): string {
  return [opts.title, opts.url].filter(Boolean).join('\n')
}

export function renderTranscript(opts: {
  title?: string
  url: string
  blocks: Block[]
  regions: SkippableRegion[]
}): string {
  // A region always starts on a block — detectSkippableRegions takes its start
  // from the block whose line fired the cue — so keying by start finds them all.
  const marked = new Map(opts.regions.map(region => [region.start, region]))

  // A region's end is the next block's start, which is a time the source really
  // recorded — except for the region that runs past the final block, where the
  // detector can only estimate it from the source's own median spacing. An
  // estimate printed in the same syntax as a fact is exactly the thing ADR 0001
  // forbids, so that one says "end" rather than inventing a second.
  const lastStart = opts.blocks.at(-1)?.start ?? 0

  const body = opts.blocks.map(block => {
    const region = marked.get(block.start)
    const until = region && region.end > lastStart ? 'end' : region ? stamp(region.end) : ''
    const mark = region
      ? `--- skippable · ${region.kind} · ${stamp(region.start)}–${until}\n` +
        `    ${region.cues.map(cue => `"${cue}"`).join(', ')}\n`
      : ''
    return `${mark}[${stamp(block.start)}] ${block.text}`
  })

  return `${header(opts)}\n\n${body.join('\n\n')}\n`
}

/**
 * The fallback artifact: what a source with no captions gets.
 *
 * Whisper returns text with no times in it, so there is nothing to stamp and
 * nothing that can be marked — a skippable region has to be checkable against a
 * time (ADR 0001) and this file has none. Same header, so the two artifacts
 * read as one thing rather than two formats.
 */
export function renderUntimedTranscript(opts: {title?: string; url: string; text: string}): string {
  return `${header(opts)}\n\n${opts.text}\n`
}
