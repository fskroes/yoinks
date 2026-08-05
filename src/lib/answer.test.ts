import assert from 'node:assert/strict'
import test from 'node:test'
import {buildExpansionPrompt, buildFollowUpPrompt, buildPrompt, parseAnswer} from './answer.js'

const BLOCKS = [
  {start: 0, text: 'the thing about the borrow checker is that it moves the error earlier'},
  {start: 94, text: "before we get into it, today's sponsor is Clerk"},
  {start: 236, text: 'Opus draws 100% of the weekly limit where Fable draws 50%'},
]

const REGIONS = [{start: 94, end: 236, kind: 'sponsor' as const, cues: ["today's sponsor"]}]

test('the prompt carries the question and the timed transcript', () => {
  const prompt = buildPrompt({
    title: 'Borrow checking',
    url: 'https://example.com/v',
    blocks: BLOCKS,
    regions: [],
    question: 'what does he say about the weekly limit?',
  })

  assert.match(prompt, /what does he say about the weekly limit\?/)
  assert.match(prompt, /\[3:56] Opus draws 100% of the weekly limit/)
  assert.match(prompt, /Borrow checking/)
})

// The shape ADR 0007 prescribes: a short gist, then the lines that back it.
test('the prompt asks for a gist of at most three sentences backed by at most five source lines', () => {
  const prompt = buildPrompt({url: 'u', blocks: BLOCKS, regions: [], question: 'q'})

  assert.match(prompt, /at most three sentences/)
  assert.match(prompt, /at most 5/)
  assert.match(prompt, /\[m:ss]/)
})

// The marks earn a second job here: the assistant is told which spans are not
// the source, so an answer is never drawn out of a sponsor read.
test('the prompt marks the skippable regions and says not to answer from them', () => {
  const prompt = buildPrompt({
    url: 'u',
    blocks: BLOCKS,
    regions: REGIONS,
    question: 'q',
  })

  assert.match(prompt, /--- skippable · sponsor · 1:34–3:56/)
  assert.match(prompt, /skippable/)
  assert.match(prompt, /[Dd]o not answer from them/)
})

// A follow-up rides the conversation: the assistant already holds the
// transcript and the rules, so neither prompt carries the transcript again.
test('an expansion prompt names the receipt and asks for its neighbourhood, without the transcript', () => {
  const prompt = buildExpansionPrompt({at: 236, text: 'Opus draws 100% of the weekly limit'})

  assert.match(prompt, /\[3:56] Opus draws 100% of the weekly limit/)
  assert.match(prompt, /near that time and about its subject/)
  assert.match(prompt, /same rules/i)
  assert.doesNotMatch(prompt, /Transcript:/)
})

test('a follow-up question prompt carries the question and nothing else new', () => {
  const prompt = buildFollowUpPrompt('what about the battery?')

  assert.match(prompt, /Question: what about the battery\?/)
  assert.match(prompt, /same rules/i)
  assert.doesNotMatch(prompt, /Transcript:/)
})

test('an answer is the gist prose and the receipts whose timestamps the source really has', () => {
  const answer = parseAnswer(
    ['He says the weekly limit is drawn unevenly.', '', '[3:56] Opus draws 100% of the weekly limit'].join('\n'),
    BLOCKS,
  )

  assert.deepEqual(answer, {
    gist: 'He says the weekly limit is drawn unevenly.',
    receipts: [{at: 236, text: 'Opus draws 100% of the weekly limit'}],
  })
})

// The kill condition, carried over from ADR 0005: a receipt has to point at a
// time the source actually recorded. An assistant that invents 7:13 for a
// source whose blocks are at 0:00, 1:34 and 3:56 has fabricated the pointer,
// and a fabricated pointer does not survive parsing.
test('drops a receipt whose timestamp matches no block in the source', () => {
  const answer = parseAnswer(
    [
      'He says the weekly limit is drawn unevenly.',
      '[3:56] Opus draws 100% of the weekly limit',
      '[7:13] he also said something else',
    ].join('\n'),
    BLOCKS,
  )

  assert.deepEqual(answer?.receipts, [{at: 236, text: 'Opus draws 100% of the weekly limit'}])
})

// The gate ADR 0007 adds on top: prose with nothing surviving behind it is
// not an answer at all — an unbacked conclusion never reaches the screen.
test('a gist with no surviving receipt is not an answer', () => {
  assert.equal(parseAnswer('The transcript does not discuss the weekly limit.', BLOCKS), undefined)
  assert.equal(parseAnswer(['A confident paragraph.', '[7:13] invented'].join('\n'), BLOCKS), undefined)
})

// The other half of the same gate: an answer is a gist backed by receipts,
// and receipts arriving alone are not one either.
test('receipts with no gist are not an answer', () => {
  assert.equal(parseAnswer('[3:56] Opus draws 100% of the weekly limit', BLOCKS), undefined)
})

test('reads a timestamp past the hour', () => {
  const blocks = [{start: 3723, text: 'still going'}]

  assert.deepEqual(parseAnswer(['g', '[1:02:03] still going'].join('\n'), blocks)?.receipts, [
    {at: 3723, text: 'still going'},
  ])
})

test('a multi-line gist is joined into one paragraph, blank lines and all', () => {
  const answer = parseAnswer(
    ['He says the limit is drawn unevenly.', '', 'He also says to check first.', '[0:00] the borrow checker moves the error earlier'].join(
      '\n',
    ),
    BLOCKS,
  )

  assert.equal(answer?.gist, 'He says the limit is drawn unevenly. He also says to check first.')
})

test('keeps the order the receipts were given in, rather than sorting by time', () => {
  const answer = parseAnswer(
    ['g', '[3:56] the weekly limit point', '[0:00] the borrow checker point'].join('\n'),
    BLOCKS,
  )

  assert.deepEqual(answer?.receipts.map(receipt => receipt.at), [236, 0])
})

test('a receipt is trimmed of the space after its stamp', () => {
  const answer = parseAnswer(['g', '[0:00]     padded out'].join('\n'), BLOCKS)

  assert.deepEqual(answer?.receipts, [{at: 0, text: 'padded out'}])
})
