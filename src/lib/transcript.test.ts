import assert from 'node:assert/strict'
import test from 'node:test'
import {renderTranscript} from './transcript.js'

const BLOCKS = [
  {start: 0, text: 'the thing about the borrow checker is that it moves the error earlier'},
  {start: 46, text: 'and once you see it that way the iterator loop stops fighting you'},
  {start: 94, text: "before we get into it, today's sponsor is Clerk"},
  {start: 141, text: 'Clerk gives you drop-in sign-in, and the free tier is generous'},
  {start: 236, text: 'right, back to the borrow checker and where lifetimes get inferred'},
]

test('opens with the title and the source url, then the timed blocks', () => {
  const text = renderTranscript({title: 'Borrow checking', url: 'https://example.com/v', blocks: BLOCKS, regions: []})

  assert.equal(
    text,
    `Borrow checking
https://example.com/v

[0:00] the thing about the borrow checker is that it moves the error earlier

[0:46] and once you see it that way the iterator loop stops fighting you

[1:34] before we get into it, today's sponsor is Clerk

[2:21] Clerk gives you drop-in sign-in, and the free tier is generous

[3:56] right, back to the borrow checker and where lifetimes get inferred
`,
  )
})

test('a source with no title is just the url', () => {
  const text = renderTranscript({url: 'https://example.com/v', blocks: [{start: 0, text: 'hello'}], regions: []})

  assert.equal(text, 'https://example.com/v\n\n[0:00] hello\n')
})

test('stamps past an hour carry the hour', () => {
  const text = renderTranscript({url: 'u', blocks: [{start: 3723, text: 'still going'}], regions: []})

  assert.match(text, /^\[1:02:03] still going$/m)
})

// ADR 0001: a region is a fact, so the artifact carries the line that gave it
// away, verbatim, for a person to check against the source. It never says the
// span is worthless — only that it is marked, and why.
test('marks a skippable region above its first block, with the cue that gave it away', () => {
  const text = renderTranscript({
    title: 'Borrow checking',
    url: 'https://example.com/v',
    blocks: BLOCKS,
    regions: [{start: 94, end: 236, kind: 'sponsor', cues: ["today's sponsor"]}],
  })

  assert.equal(
    text,
    `Borrow checking
https://example.com/v

[0:00] the thing about the borrow checker is that it moves the error earlier

[0:46] and once you see it that way the iterator loop stops fighting you

--- skippable · sponsor · 1:34–3:56
    "today's sponsor"
[1:34] before we get into it, today's sponsor is Clerk

[2:21] Clerk gives you drop-in sign-in, and the free tier is generous

[3:56] right, back to the borrow checker and where lifetimes get inferred
`,
  )
})

test('lists every phrase that marked the line, not just the first', () => {
  const text = renderTranscript({
    url: 'u',
    blocks: [{start: 30, text: 'if this helped, subscribe and hit the bell'}],
    regions: [{start: 30, end: 60, kind: 'subscribe', cues: ['subscribe and', 'hit the bell', 'the bell']}],
  })

  assert.match(text, /^ {4}"subscribe and", "hit the bell", "the bell"$/m)
})

test('a source with nothing marked reads as a plain timed transcript', () => {
  const text = renderTranscript({url: 'u', blocks: BLOCKS, regions: []})

  assert.equal(text.includes('skippable'), false)
})

test('marks each region separately when a source has several', () => {
  const text = renderTranscript({
    url: 'u',
    blocks: BLOCKS,
    regions: [
      {start: 94, end: 141, kind: 'sponsor', cues: ["today's sponsor"]},
      {start: 236, end: 280, kind: 'outro', cues: ['thanks for watching']},
    ],
  })

  assert.deepEqual(
    text.split('\n').filter(line => line.startsWith('---')),
    ['--- skippable · sponsor · 1:34–2:21', '--- skippable · outro · 3:56–end'],
  )
})

// A transcript records when a line was said, never when it stopped, so the end
// of the region covering the final block is the detector's estimate from the
// source's own median spacing — not a time the source recorded. Printing it in
// the same syntax as the exact ends would dress an estimate as a fact, which is
// the thing ADR 0001 exists to stop.
test('says "end" rather than inventing a second the source never recorded', () => {
  const text = renderTranscript({
    url: 'u',
    blocks: [{start: 0, text: 'content'}, {start: 90, text: 'thanks for watching'}],
    regions: [{start: 90, end: 180, kind: 'outro', cues: ['thanks for watching']}],
  })

  assert.match(text, /^--- skippable · outro · 1:30–end$/m)
  assert.equal(text.includes('3:00'), false)
})

// The same region one block earlier ends on a time the source really recorded,
// so that one is printed.
test('prints an exact end when the region stops before the last block', () => {
  const text = renderTranscript({
    url: 'u',
    blocks: [
      {start: 0, text: 'sponsored by Clerk'},
      {start: 90, text: 'back to the borrow checker'},
      {start: 180, text: 'and that is the trick'},
    ],
    regions: [{start: 0, end: 90, kind: 'sponsor', cues: ['sponsored by']}],
  })

  assert.match(text, /^--- skippable · sponsor · 0:00–1:30$/m)
})
