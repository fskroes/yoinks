import assert from 'node:assert/strict'
import test from 'node:test'
import {buildExpansionPrompt, buildFollowUpPrompt, buildPrompt, factStream, parseFacts} from './answer.js'

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
test('an expansion prompt names the fact and asks for its neighbourhood, without the transcript', () => {
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

test('keeps a fact whose timestamp is a block the source really has', () => {
  const {facts, dropped} = parseFacts('[3:56] Opus draws 100% of the weekly limit', BLOCKS)

  assert.deepEqual(facts, [{at: 236, text: 'Opus draws 100% of the weekly limit'}])
  assert.deepEqual(dropped, [])
})

// The kill condition, named before this code existed: a fact has to point at a
// time the source actually recorded. An assistant that invents 7:13 for a source
// whose blocks are at 0:00, 1:34 and 3:56 has fabricated the citation, and a
// fabricated citation is exactly what ADR 0001 says must never be shown as a
// fact — so it does not survive parsing.
test('drops a fact whose timestamp matches no block in the source', () => {
  const {facts, dropped} = parseFacts(
    ['[3:56] Opus draws 100% of the weekly limit', '[7:13] he also said something else'].join('\n'),
    BLOCKS,
  )

  assert.deepEqual(facts, [{at: 236, text: 'Opus draws 100% of the weekly limit'}])
  assert.deepEqual(dropped, ['[7:13] he also said something else'])
})

test('reads a timestamp past the hour', () => {
  const blocks = [{start: 3723, text: 'still going'}]

  assert.deepEqual(parseFacts('[1:02:03] still going', blocks).facts, [{at: 3723, text: 'still going'}])
})

test('ignores preamble, blank lines, and trailing chatter', () => {
  const {facts} = parseFacts(
    ['Here is what I found:', '', '[0:00] the borrow checker moves the error earlier', '', 'Hope that helps!'].join('\n'),
    BLOCKS,
  )

  assert.deepEqual(facts, [{at: 0, text: 'the borrow checker moves the error earlier'}])
})

test('keeps the order the answer was given in, rather than sorting by time', () => {
  const {facts} = parseFacts(
    ['[3:56] the weekly limit point', '[0:00] the borrow checker point'].join('\n'),
    BLOCKS,
  )

  assert.deepEqual(facts.map(fact => fact.at), [236, 0])
})

// A source that does not answer the question produces no facts. That is a real
// outcome, not a failure, and it must not be papered over with prose.
test('an answer with nothing citable in it is no facts', () => {
  const {facts, dropped} = parseFacts('The transcript does not discuss the weekly limit.', BLOCKS)

  assert.deepEqual(facts, [])
  assert.deepEqual(dropped, ['The transcript does not discuss the weekly limit.'])
})

test('a fact is trimmed of the space after its stamp', () => {
  const {facts} = parseFacts('[0:00]     padded out', BLOCKS)

  assert.deepEqual(facts, [{at: 0, text: 'padded out'}])
})

// Streaming: a fact renders only when its line is complete and has passed the
// same gate as any other fact (ADR 0005) — a half-arrived line shows nothing.
test('factStream emits a fact only when its line completes and checks out', () => {
  const push = factStream(BLOCKS)

  assert.deepEqual(push('[3:56] Opus draws 100%'), [])
  assert.deepEqual(push(' of the weekly limit\n[9:'), [
    {at: 236, text: 'Opus draws 100% of the weekly limit'},
  ])
  // an uncheckable fact and a bare line die at the same gate as ever
  assert.deepEqual(push('99] invented\nno stamp\n[0:00] the borrow checker moves the error earlier\n'), [
    {at: 0, text: 'the borrow checker moves the error earlier'},
  ])
})
