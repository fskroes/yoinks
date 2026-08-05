import assert from 'node:assert/strict'
import test from 'node:test'
import {ASKED, mergeRow, parseHistory, type RecentRow} from './history.js'

const row = (url: string, at = '2026-08-05T10:00:00.000Z'): RecentRow => ({
  url,
  title: `title for ${url}`,
  artifact: 'mp4',
  at,
})

test('parseHistory keeps well-formed rows and drops everything else', () => {
  const parsed = parseHistory([
    row('https://a'),
    'https://old-format-was-a-bare-string',
    {url: 'https://b', title: 'no artifact, no time'},
    null,
    row('https://c'),
  ])
  assert.deepEqual(
    parsed.map(entry => entry.url),
    ['https://a', 'https://c'],
  )
})

test('parseHistory survives a file that is not a list', () => {
  assert.deepEqual(parseHistory({}), [])
  assert.deepEqual(parseHistory(undefined), [])
})

test('mergeRow puts the newest first and holds one row per source', () => {
  const list = [row('https://a'), row('https://b')]
  const merged = mergeRow(row('https://b', '2026-08-05T12:00:00.000Z'), list)
  assert.deepEqual(
    merged.map(entry => entry.url),
    ['https://b', 'https://a'],
  )
  assert.equal(merged[0]!.at, '2026-08-05T12:00:00.000Z')
})

test('asking about a source you already saved keeps the artifact', () => {
  const saved = {...row('https://a'), artifact: 'mp3'}
  const merged = mergeRow({...row('https://a', '2026-08-05T14:00:00.000Z'), artifact: ASKED}, [saved])
  assert.equal(merged[0]!.artifact, 'mp3', 'the file you have outranks the question you asked')
  assert.equal(merged[0]!.at, '2026-08-05T14:00:00.000Z', 'and the row still moves to the top')
})

test('saving a source you only asked about replaces `asked` with the file', () => {
  const asked = {...row('https://a'), artifact: ASKED}
  const merged = mergeRow({...row('https://a'), artifact: 'mp4'}, [asked])
  assert.equal(merged[0]!.artifact, 'mp4')
})

test('mergeRow caps the file at fifty rows', () => {
  const list = Array.from({length: 50}, (_, index) => row(`https://${index}`))
  const merged = mergeRow(row('https://new'), list)
  assert.equal(merged.length, 50)
  assert.equal(merged[0]!.url, 'https://new')
  assert.equal(merged.at(-1)!.url, 'https://48')
})
