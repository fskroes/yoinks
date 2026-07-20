import assert from 'node:assert/strict'
import test from 'node:test'
import {cleanTranscript} from './transcribe.js'
import {buildChoices} from './ytdlp.js'

test('cleanTranscript trims lines and drops noise-only markers', () => {
  const raw = ' Hello there.\n[Music]\n(silence)\n  Second line.  \n\n[BLANK_AUDIO]\n'
  assert.equal(cleanTranscript(raw), 'Hello there.\nSecond line.')
})

test('cleanTranscript keeps lines that merely contain brackets', () => {
  assert.equal(cleanTranscript('He said [sic] hello.\n'), 'He said [sic] hello.')
})

test('cleanTranscript returns empty string for speechless output', () => {
  assert.equal(cleanTranscript('[Music]\n[Music]\n'), '')
})

test('buildChoices always offers a transcript option last', () => {
  const choices = buildChoices({title: 't', formats: []})
  const last = choices.at(-1)!
  assert.equal(last.kind, 'transcript')
  // bestaudio only — the wav conversion happens locally, no yt-dlp postprocessing
  assert.deepEqual(last.args, ['-f', 'ba/b'])
})
