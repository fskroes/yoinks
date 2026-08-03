import assert from 'node:assert/strict'
import test from 'node:test'
import {parseWhisperVtt} from './transcribe.js'
import {buildChoices} from './ytdlp.js'

/** The shape whisper.cpp writes with `-ovtt`: its own segments, one per cue, text indented by one space. */
const WHISPER = `WEBVTT

00:00:00.000 --> 00:00:04.760
 At this point, it's pretty well established that AI is capable at hacking.

00:00:04.760 --> 00:00:07.040
 And how scared should we be?
`

test('turns whisper cues into the same timed blocks the caption path produces', () => {
  assert.deepEqual(parseWhisperVtt(WHISPER), [
    {
      start: 0,
      text: "At this point, it's pretty well established that AI is capable at hacking. And how scared should we be?",
    },
  ])
})

// Whisper writes a cue for music and silence the same way it writes one for
// speech. They are not what was said, and the flat-text path dropped them
// before this one existed — so they are dropped here too, cue and all.
test('drops noise-only cues rather than reading them as speech', () => {
  const blocks = parseWhisperVtt(`WEBVTT

00:00:00.000 --> 00:00:02.000
 [Music]

00:00:02.000 --> 00:00:04.000
 Right, where were we.

00:00:04.000 --> 00:00:06.000
 (silence)

00:00:06.000 --> 00:00:08.000
 [BLANK_AUDIO]
`)

  assert.deepEqual(blocks, [{start: 2, text: 'Right, where were we.'}])
})

test('keeps a line that merely contains brackets', () => {
  assert.deepEqual(parseWhisperVtt(`WEBVTT

00:00:00.000 --> 00:00:02.000
 He said [sic] hello.
`), [{start: 0, text: 'He said [sic] hello.'}])
})

// The caller turns this into "No speech found in this video." — so speechless
// audio has to come back as nothing at all, not as one empty block.
test('speechless audio is no blocks at all', () => {
  assert.deepEqual(parseWhisperVtt('WEBVTT\n\n00:00:00.000 --> 00:00:02.000\n [Music]\n'), [])
})

test('buildChoices always offers a transcript option last', () => {
  const choices = buildChoices({title: 't', formats: []})
  const last = choices.at(-1)!
  assert.equal(last.kind, 'transcript')
  // bestaudio only — the wav conversion happens locally, no yt-dlp postprocessing
  assert.deepEqual(last.args, ['-f', 'ba/b'])
})
