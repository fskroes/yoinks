import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import {renderToString} from 'ink'
import {Recent, RECENT_ROWS, recentTitle} from './recent.js'
import type {RecentRow} from '../lib/history.js'

const WIDTH = 73

const row = (title: string, artifact = 'mp4'): RecentRow => ({
  url: `https://example.com/${title.length}`,
  title,
  artifact,
  at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
})

const render = (rows: RecentRow[], selected = -1) =>
  renderToString(React.createElement(Recent, {rows, selected, width: WIDTH}))

test('a row shows the source title, the artifact and the age', () => {
  const frame = render([row('Lecture 4 — control surfaces', 'mp3')])
  assert.match(frame, /Lecture 4 — control surfaces/)
  assert.match(frame, /mp3 · 3h/)
})

test('a source that produced an answer and no file says so', () => {
  const frame = render([row('Interview with the ffmpeg maintainer', 'asked')])
  assert.match(frame, /asked · 3h/)
})

test('the rendered title is the string clicks are matched against', () => {
  // lib/click-map.ts finds targets by their text in the frame, so a title
  // truncated one way and matched another is a dead click target
  const long = row('I replaced my whole dev setup with a $20 gooseneck mic and 128 GB of RAM')
  const frame = render([long])
  const label = recentTitle(long, WIDTH)
  assert.ok(label.endsWith('…'), 'a title this long must truncate')
  assert.ok(frame.includes(label), 'the frame must contain exactly what the click matches')
})

test('only the selected row carries the cursor', () => {
  const frame = render([row('first'), row('second')], 1)
  assert.equal(frame.match(/›/g)?.length, 1)
  assert.match(frame, /›\s+second/)
})

test('the panel never grows past its row limit', () => {
  const rows = Array.from({length: RECENT_ROWS + 4}, (_, index) => row(`source ${index}`))
  const frame = render(rows)
  assert.ok(frame.includes(`source ${RECENT_ROWS - 1}`))
  assert.ok(!frame.includes(`source ${RECENT_ROWS}`))
})
