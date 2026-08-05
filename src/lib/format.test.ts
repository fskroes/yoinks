import assert from 'node:assert/strict'
import test from 'node:test'
import {formatAge} from './format.js'

const NOW = Date.parse('2026-08-05T12:00:00.000Z')
const ago = (ms: number) => new Date(NOW - ms).toISOString()

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

test('formatAge shortens as the row gets older', () => {
  assert.equal(formatAge(ago(30_000), NOW), 'now')
  assert.equal(formatAge(ago(14 * MINUTE), NOW), '14m')
  assert.equal(formatAge(ago(3 * HOUR), NOW), '3h')
  assert.equal(formatAge(ago(25 * HOUR), NOW), 'yesterday')
  assert.equal(formatAge(ago(6 * DAY), NOW), '6d')
  assert.equal(formatAge(ago(20 * DAY), NOW), '2w')
})

test('formatAge falls back to the date once weeks stop meaning anything', () => {
  assert.equal(formatAge(ago(60 * DAY), NOW), '2026-06-06')
})

test('formatAge says nothing rather than NaN for an unreadable time', () => {
  assert.equal(formatAge('not a time', NOW), '')
})
