import assert from 'node:assert/strict'
import test from 'node:test'
import {askLine, type Ask} from './asks.js'

const base = {
  at: '2026-08-05T12:00:00.000Z',
  url: 'https://youtu.be/dQw4w9WgXcQ',
  title: 'Interview with the ffmpeg maintainer',
  receipts: 4,
  dropped: 1,
}

test('a question is written whole, on one line', () => {
  const ask: Ask = {...base, kind: 'question', question: 'what did they say the pricing was?'}
  const line = askLine(ask)
  assert.ok(line.endsWith('\n'))
  assert.equal(line.split('\n').filter(Boolean).length, 1)
  assert.deepEqual(JSON.parse(line), ask)
})

test('a question holding a newline stays one line', () => {
  const line = askLine({...base, kind: 'question', question: 'first\nsecond'})
  assert.equal(line.split('\n').filter(Boolean).length, 1)
  assert.equal(JSON.parse(line).question, 'first\nsecond')
})

test('an expansion records the second, never the receipt it came from', () => {
  const ask: Ask = {...base, kind: 'expansion', second: 237}
  const parsed = JSON.parse(askLine(ask))
  assert.equal(parsed.second, 237)
  assert.equal(parsed.question, undefined)
})

test('the gate is countable from the log alone', () => {
  const parsed = JSON.parse(askLine({...base, kind: 'question', question: 'anything'}))
  assert.equal(parsed.receipts, 4)
  assert.equal(parsed.dropped, 1)
})
