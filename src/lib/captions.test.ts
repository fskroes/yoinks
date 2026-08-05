import assert from 'node:assert/strict'
import test from 'node:test'
import {parseCaptions} from './captions.js'
import {detectSkippableRegions} from './skippable.js'

// YouTube auto-subs are rolling: a cue carries the previous cue's line plus a
// new one, and a 10ms bridge cue in between shows the new line settled. Left
// in, every word appears in three consecutive cues.
const ROLLING = `WEBVTT
Kind: captions
Language: en

00:00:00.000 --> 00:00:02.070 align:start position:0%

the<00:00:00.560><c> borrow</c><00:00:00.720><c> checker</c><00:00:01.080><c> moves</c><00:00:01.400><c> the</c>

00:00:02.070 --> 00:00:02.080 align:start position:0%
the borrow checker moves the


00:00:02.080 --> 00:00:04.310 align:start position:0%
the borrow checker moves the
error<00:00:02.160><c> earlier</c><00:00:02.480><c> than</c><00:00:02.680><c> you'd</c><00:00:03.040><c> like</c>

00:00:04.310 --> 00:00:04.320 align:start position:0%
error earlier than you'd like

`

test('strips the rolling overlap, so a word said once appears once', () => {
  assert.deepEqual(parseCaptions(ROLLING), [
    {start: 0, text: "the borrow checker moves the error earlier than you'd like"},
  ])
})

test('drops the header, the cue settings, and the inline word timings', () => {
  const [block] = parseCaptions(ROLLING)

  assert.equal(/WEBVTT|Kind:|Language:|align:start|position:0%|<[^>]+>/.test(block.text), false)
})

// The detector's two tuning numbers count blocks, not cues: REACH lets a
// sponsor read grow 3 blocks, and rareIn scales with block count. Both were
// calibrated at ~45s paragraphs. Returning raw cues would leave every test in
// skippable.test.ts passing and make the detector quietly much worse.
test('groups cues into paragraphs of at least 45 seconds, not raw cues', () => {
  const blocks = parseCaptions(`WEBVTT

00:00:00.000 --> 00:00:29.000
the thing about the borrow checker

00:00:30.000 --> 00:00:49.000
is that it moves the error earlier

00:00:50.000 --> 00:01:19.000
which is the whole trick

00:01:20.000 --> 00:01:40.000
back to lifetimes
`)

  assert.deepEqual(blocks, [
    {start: 0, text: 'the thing about the borrow checker is that it moves the error earlier which is the whole trick'},
    {start: 80, text: 'back to lifetimes'},
  ])
})

// A block's start is what the ground truth in docs/validation/step-1-cold-read.md
// was recorded against, and those are whole seconds. Rounding .900 up would move
// every recorded slot by one.
test('a block starts at its first cue, truncated to a whole second', () => {
  const blocks = parseCaptions(`WEBVTT

00:01:34.900 --> 00:01:36.000
today's sponsor is Clerk
`)

  assert.deepEqual(blocks, [{start: 94, text: "today's sponsor is Clerk"}])
})

test('reads timestamps past an hour', () => {
  const blocks = parseCaptions(`WEBVTT

01:02:03.000 --> 01:02:05.000
still going
`)

  assert.deepEqual(blocks, [{start: 3723, text: 'still going'}])
})

// The overlap is found by the longest match between the previous cue's tail and
// this cue's head. Taking the shortest would leave duplicated words behind.
test('takes the longest overlap when the tail and head share several words', () => {
  const blocks = parseCaptions(`WEBVTT

00:00:00.000 --> 00:00:02.000
Clerk gives you drop-in sign-in

00:00:02.000 --> 00:00:04.000
gives you drop-in sign-in and the free tier is generous
`)

  assert.deepEqual(blocks, [
    {start: 0, text: 'Clerk gives you drop-in sign-in and the free tier is generous'},
  ])
})

// Human-authored captions do not roll — each cue carries only its own words —
// and X wraps every one of them in a custom tag. The overlap strip was written
// for machine-generated captions and runs on these too, so the thing worth
// pinning down is that it leaves a genuinely repeated phrase alone. Real
// punctuation and capitalisation are what save it: the previous cue's tail has
// to match this cue's head word for word, and `is,` is not `is`.
const HUMAN = `WEBVTT

00:00:00.000 --> 00:00:02.500
<X-word-ms ms=359,360,1060,99,120 index=1 character_ranges=0-5,6-10>So the thing about it is,</X-word-ms>

00:00:02.500 --> 00:00:05.000
<X-word-ms ms=240,120,300 index=2 character_ranges=0-3,4-9>it is genuinely hard. Hard,</X-word-ms>

00:00:05.000 --> 00:00:07.500
<X-word-ms ms=99,140 index=3 character_ranges=0-4>hard in a way you don't expect.</X-word-ms>
`

test('keeps a phrase human-authored captions repeat across a cue boundary', () => {
  assert.deepEqual(parseCaptions(HUMAN), [
    {start: 0, text: "So the thing about it is, it is genuinely hard. Hard, hard in a way you don't expect."},
  ])
})

test("strips X's custom cue tag", () => {
  const [block] = parseCaptions(HUMAN)

  assert.equal(/X-word-ms|character_ranges|index=/.test(block.text), false)
})

// The residual cost of running the overlap strip over human-authored captions,
// recorded
// rather than fixed: a bare repeat with nothing to tell the two copies apart
// loses one. The parser cannot know which kind of track it is reading, and the
// strip is what every number in docs/validation was measured through — so this
// stays, and this test is here to make it visible if anyone widens it.
test('a bare unpunctuated repeat across a cue boundary loses one copy', () => {
  assert.deepEqual(
    parseCaptions(`WEBVTT

00:00:00.000 --> 00:00:02.000
it was very very

00:00:02.000 --> 00:00:04.000
very good
`),
    [{start: 0, text: 'it was very very good'}],
  )
})

test('a source with no cues is no blocks, not one empty block', () => {
  assert.deepEqual(parseCaptions('WEBVTT\nKind: captions\nLanguage: en\n'), [])
  assert.deepEqual(parseCaptions(''), [])
})

/** The rolling shape auto-subs actually arrive in: every cue reprints the line before it. */
function rollingVtt(lines: string[], every: number): string {
  const stamp = (s: number) =>
    `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.000`
  const cues = lines.map((line, i) => {
    const at = i * every
    const previous = i > 0 ? `${lines[i - 1]}\n` : ''
    return `${stamp(at)} --> ${stamp(at + 2)} align:start position:0%\n${previous}${line}\n`
  })
  return `WEBVTT\nKind: captions\nLanguage: en\n\n${cues.join('\n')}`
}

// The point of the whole caption path: what comes out of it is something
// detectSkippableRegions can run on, at the granularity its two tuning numbers
// were calibrated for. What this pins down is the paragraph grouping — the
// overlap strip is guarded by the first and sixth tests, and does not on its
// own decide whether a region is found (see captions.ts).
test('produces blocks a sponsor read can be detected in', () => {
  const blocks = parseCaptions(
    rollingVtt(
      [
        'the thing about the borrow checker is that it moves the error earlier',
        'and once you see it that way the iterator loop stops fighting you',
        'that is genuinely the whole reason people put up with it',
        "before we get into it, today's sponsor is Clerk, authentication for your app",
        'Clerk gives you drop-in sign-in and it took me an afternoon',
        'Clerk handles the session tokens so you never touch them',
        'Clerk has a generous free tier as well, which is unusual',
        'Clerk, honestly, is the bit I stopped having to think about',
        'and that is the last I will say about Clerk',
        'right, back to the borrow checker and where lifetimes get inferred',
        'that is the trick, it is not more complicated than that',
      ],
      30,
    ),
  )

  assert.deepEqual(blocks.map(block => block.start), [0, 90, 180, 270])
  assert.deepEqual(detectSkippableRegions(blocks), [
    {start: 90, end: 270, kind: 'sponsor', cues: ["today's sponsor"]},
  ])
})

/**
 * The shape whisper.cpp writes with `-ovtt`: its own segments, one sentence-ish
 * per cue at around four seconds each, punctuated and capitalised, text
 * indented by one space. Nothing rolls — a cue carries only its own words.
 */
function whisperVtt(lines: string[], every: number): string {
  const stamp = (s: number) =>
    `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.000`
  const cues = lines.map((line, i) => `${stamp(i * every)} --> ${stamp((i + 1) * every)}\n ${line}\n`)
  return `WEBVTT\n\n${cues.join('\n')}`
}

const RECOGNISED = [
  'So the thing about the borrow checker is that it moves the error earlier.',
  'That is the whole trick, and it took me a long time to see it.',
  'Once you do, the iterator loop stops fighting you.',
  'People put up with it for exactly that reason.',
  'I want to come back to lifetimes in a moment.',
  'But there is something I should get out of the way.',
  'It will only take a second, I promise.',
  'We have all sat through worse than this.',
  'Anyway, where was I with the checker.',
  'Right, the error moves earlier, that was the point.',
  'And that changes how you write the whole loop.',
  'You stop reaching for clones you do not need.',
  'Which is genuinely the thing nobody tells you.',
  // A straight apostrophe, because that is what whisper writes — zero
  // typographic ones across all six sources of the step 9 corpus, against 88 to
  // 276 straight ones each. It matters: every cue phrase spelled `today'?s`
  // (src/lib/skippable.ts) would silently stop firing on a curly one.
  "Before we get into it though, a word from today's sponsor.",
  'Clerk does authentication for your application.',
  'Clerk gave me drop-in sign-in in an afternoon.',
  'Clerk handles the session tokens so you never touch them.',
  'Clerk has a free tier that is unusually generous.',
  'Clerk is honestly the piece I stopped thinking about.',
  'That is the last I will say about Clerk.',
  'So, back to the borrow checker and where lifetimes get inferred.',
  'The compiler is doing more for you than it lets on.',
  'It infers the common case and asks about the rest.',
  'That is not more complicated than it sounds.',
  'The rest of this is just practice, really.',
  'You write it wrong a few times and then you do not.',
  'Which is how everything works, I suppose.',
  'Right, that is where I will leave the checker.',
  'There is one more thing worth showing you.',
  'And then I will let you get on with it.',
]

/**
 * The claim the caption-less path rests on: whisper's VTT needs no parser of
 * its own. Same `parseCaptions`, same 45-second granularity, same detector —
 * measured across six sources in `docs/validation/step-9-whisper-timing.md`,
 * and pinned here so it is checkable without the network or whisper on PATH.
 */
test('reads whisper’s own VTT into blocks a sponsor read is detected in', () => {
  const blocks = parseCaptions(whisperVtt(RECOGNISED, 4))

  assert.deepEqual(detectSkippableRegions(blocks), [
    {start: 52, end: 104, kind: 'sponsor', cues: ["today's sponsor", 'a word from']},
  ])
})

/**
 * Whisper's cues are around four seconds where auto-subs are around one, and
 * `paragraphs` keeps the cue that carries it past 45 seconds. So a whisper
 * block runs 45 seconds plus one whisper cue, and every boundary after the
 * first is a little later than the caption path's would be.
 *
 * That is why step 9 scores two sources' region starts as early where the
 * caption path scores one: a read that begins within a couple of seconds of a
 * boundary falls on the earlier block. It is `prototypes/map` defect 1 — the
 * 45-second floor — and not a defect this path introduces, so it is recorded
 * here rather than tuned away.
 */
test('a block runs 45 seconds plus the cue that overshoots it', () => {
  assert.deepEqual(parseCaptions(whisperVtt(RECOGNISED, 4)).map(block => block.start), [0, 52, 104])
})

// Nothing rolls in whisper's output, so the strip written for auto-subs has to
// leave it alone. Measured on a real 17-minute source: 3,408 words in the VTT,
// 3,407 out — one coincidental adjacent duplicate, nothing mangled.
test('leaves whisper’s non-rolling cues intact', () => {
  const blocks = parseCaptions(whisperVtt(['I think it is fine.', 'It is fine, I think.'], 4))

  assert.deepEqual(blocks, [{start: 0, text: 'I think it is fine. It is fine, I think.'}])
})
