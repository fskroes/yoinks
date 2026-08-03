/**
 * A VTT, turned into the timed blocks the detector reads.
 *
 * Pure: a VTT string in, blocks out. No I/O, no network, no yt-dlp.
 *
 * Both rungs come through here. The platform's captions arrive as VTT, and
 * whisper writes VTT too when asked (`parseWhisperVtt` in `./transcribe.ts`
 * strips its noise markers and hands the rest straight to `parseCaptions`), so
 * a source with no captions produces the same blocks and the same marks as one
 * with them. That one parser serves both is measured across six sources in
 * `docs/validation/step-9-whisper-timing.md`.
 *
 * This is a port of `bin/vtt2txt.py` from the external corpus script, which is
 * what produced every transcript behind the 6/6 recorded in
 * `prototypes/map/README.md`. Both things it does are preprocessing that
 * `detectSkippableRegions` silently depends on, so the port is deliberately
 * faithful rather than improved — see the two notes below.
 */

import type {Block} from './skippable.js'

/** `00:01:34.900 --> ` — trailing cue settings (`align:start position:0%`) are ignored. */
const CUE_START = /^(\d\d):(\d\d):(\d\d)\.\d{3} --> /
/** Auto-subs time individual words: `the<00:00:00.560><c> borrow</c>`. */
const TAG = /<[^>]+>/g
const HEADER = /^(WEBVTT|Kind:|Language:)/

/**
 * How long a paragraph runs before the next cue starts a new one.
 *
 * Load-bearing, and not a formatting choice. The detector's two tuning numbers
 * are calibrated to this granularity: `REACH` counts blocks, so 3 is ~135
 * seconds of growth here and ~6 seconds against raw 1–3s cues; and `rareIn`
 * scales with block count, so the same source at cue granularity moves the
 * threshold by ~30×. Change this and the 6/6 has to be re-measured — nothing
 * in the test suite will tell you it broke, because those tests hand-build
 * their blocks.
 */
const PARAGRAPH_SECONDS = 45

type Cue = {start: number; words: string[]}

function readCues(vtt: string): Cue[] {
  const cues: Cue[] = []
  let start: number | undefined
  let buffer: string[] = []

  const flush = () => {
    if (start !== undefined && buffer.length) cues.push({start, words: buffer.join(' ').split(/\s+/)})
  }

  for (const raw of vtt.split(/\r?\n/)) {
    const at = CUE_START.exec(raw)
    if (at) {
      flush()
      // Whole seconds, truncated — the ground truth in docs/validation was
      // recorded against these, so rounding .900 up would move every slot.
      start = Number(at[1]) * 3600 + Number(at[2]) * 60 + Number(at[3])
      buffer = []
      continue
    }
    const line = raw.replace(TAG, '').trim()
    if (line && !HEADER.test(line)) buffer.push(line)
  }
  flush()
  return cues
}

/**
 * Auto-subs are rolling captions: each cue reprints most of the previous cue's
 * text so the viewer sees a line settle before it scrolls away.
 *
 * Measured on a real 45-minute source: stripping the overlap takes 28,985
 * words down to 9,663, so without it the saved transcript is every line
 * printed three times. It also drops the 10ms bridge cues entirely, which
 * moves where the paragraph boundaries fall — 57 blocks rather than 59, and
 * every region start shifts with them (sponsor at 0:47 not 0:46, outro at
 * 44:21 not 43:59). The ground truth in `docs/validation/` was recorded
 * against the stripped output, so it only reproduces with this.
 *
 * What it does *not* do, contrary to the note this port was written from, is
 * decide whether growth fires at all: the same three regions are found either
 * way, because the duplication lands inside a block rather than across blocks,
 * and the detector counts blocks a word appears in. The over-reach does get
 * worse without it — 26:01–27:37 becomes 25:47–28:49.
 *
 * The overlap is the longest match between the previous cue's tail and this
 * cue's head. Longest, not shortest: a read that says "Clerk gives you" twice
 * would otherwise keep half of it.
 */
function stripRollingOverlap(cues: Cue[]): Cue[] {
  const fresh: Cue[] = []
  let previous: string[] = []
  for (const {start, words} of cues) {
    let overlap = 0
    for (let k = Math.min(previous.length, words.length); k > 0; k--) {
      if (previous.slice(-k).every((word, i) => word === words[i])) {
        overlap = k
        break
      }
    }
    const rest = words.slice(overlap)
    if (rest.length) fresh.push({start, words: rest})
    previous = words
  }
  return fresh
}

/** Accumulate cues until one starts a full paragraph past the paragraph's own start. */
function paragraphs(cues: Cue[]): Block[] {
  const blocks: Block[] = []
  let start: number | undefined
  let words: string[] = []
  for (const cue of cues) {
    if (start === undefined) start = cue.start
    words.push(...cue.words)
    if (cue.start - start >= PARAGRAPH_SECONDS) {
      blocks.push({start, text: words.join(' ')})
      start = undefined
      words = []
    }
  }
  if (start !== undefined && words.length) blocks.push({start, text: words.join(' ')})
  return blocks
}

export function parseCaptions(vtt: string): Block[] {
  return paragraphs(stripRollingOverlap(readCues(vtt)))
}
