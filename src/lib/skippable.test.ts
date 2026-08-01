import assert from 'node:assert/strict'
import test from 'node:test'
import {detectSkippableRegions} from './skippable.js'

test('marks a sponsor read, and says which line gave it away', () => {
  const regions = detectSkippableRegions([
    {start: 0, text: 'the thing about the borrow checker is that it moves the error earlier'},
    {start: 45, text: "before we get into it, today's sponsor is Clerk, the authentication layer"},
    {start: 90, text: 'anyway, back to the borrow checker and what it does to an iterator loop'},
  ])

  assert.deepEqual(regions, [{start: 45, end: 90, kind: 'sponsor', cues: ["today's sponsor"]}])
})

test('a passing mention of sponsors is not a sponsor read', () => {
  const regions = detectSkippableRegions([
    {start: 0, text: 'the thing about the borrow checker is that it moves the error earlier'},
    {start: 2160, text: 'most of the money I got from sponsors went straight back into the servers'},
  ])

  assert.deepEqual(regions, [])
})

// Blocks are 30s apart here, not the 45s the prototype's corpus happened to
// use, so a final region's end has to come from the source's own spacing.
test('marks a creator outro, which runs past the last line by the source’s own block spacing', () => {
  const regions = detectSkippableRegions([
    {start: 0, text: 'the thing about the borrow checker is that it moves the error earlier'},
    {start: 30, text: 'and once you see it that way the iterator loop stops fighting you'},
    {start: 60, text: 'that is the whole trick, it is not more complicated than that'},
    {start: 90, text: 'thanks for watching, see you in the next one'},
  ])

  assert.deepEqual(regions, [
    {start: 90, end: 120, kind: 'outro', cues: ['thanks for watching', 'see you in the next one']},
  ])
})

// "Subscribe" has an innocent twin that "today's sponsor" does not, so one
// phrase is not enough: a real interruption corroborates itself with the bell,
// early access, or a link. The region has to be able to show that pair.
test('marks a subscribe interruption only when a second cue corroborates the first', () => {
  const regions = detectSkippableRegions([
    {start: 0, text: 'the thing about the borrow checker is that it moves the error earlier'},
    {start: 30, text: 'if this helped, subscribe and hit the bell so you catch the next upload'},
    {start: 60, text: 'right, back to lifetimes and where they actually get inferred'},
  ])

  assert.deepEqual(regions, [
    {start: 30, end: 60, kind: 'subscribe', cues: ['subscribe and', 'hit the bell', 'the bell']},
  ])
})

test('a source about paying for models says "subscribe to" and means none of it', () => {
  const regions = detectSkippableRegions([
    {start: 0, text: 'so you subscribe to the pro plan and that gets you the bigger window'},
    {start: 30, text: 'and if you subscribe for a year it works out cheaper per month'},
  ])

  assert.deepEqual(regions, [])
})

// A cue fires once, at the top of a read; the middle of a sponsor read never
// says "sponsor". What it does say, over and over, is the product's name — and
// nothing else in the source does.
test('a sponsor read runs on while the ad keeps repeating its product name', () => {
  const regions = detectSkippableRegions([
    {start: 0, text: 'the thing about the borrow checker is that it moves the error earlier'},
    {start: 30, text: 'and once you see it that way the iterator loop stops fighting you'},
    {start: 60, text: "before we get into it, today's sponsor is Clerk, authentication for your app"},
    {start: 90, text: 'Clerk gives you drop-in sign-in, and the free tier is generous'},
    {start: 120, text: 'right, back to the borrow checker and where lifetimes get inferred'},
    {start: 150, text: 'that is the whole trick, it is not more complicated than that'},
  ])

  assert.deepEqual(regions, [
    {start: 60, end: 120, kind: 'sponsor', cues: ["today's sponsor"]},
  ])
})

// Growth is capped, so a read that keeps naming its product cannot swallow the
// rest of the source. Regions over-reach on purpose — under-growing was tried
// and was worse, because it leaked ad copy into what follows the read — but the
// over-reach is bounded rather than open-ended.
test('a sponsor read stops growing after its reach, however long the ad runs', () => {
  const rest = Array.from({length: 30}, (_, i) => ({
    start: (i + 6) * 30,
    text: 'more about the borrow checker, lifetimes, iterator loops and error messages',
  }))
  const regions = detectSkippableRegions([
    {start: 0, text: 'the thing about the borrow checker is that it moves the error earlier'},
    {start: 30, text: "before we get into it, today's sponsor is Clerk, authentication for your app"},
    {start: 60, text: 'Clerk gives you drop-in sign-in and it took me an afternoon'},
    {start: 90, text: 'Clerk handles the session tokens so you never touch them'},
    {start: 120, text: 'Clerk has a generous free tier as well, which is unusual'},
    {start: 150, text: 'Clerk, honestly, is the bit I stopped having to think about'},
    ...rest,
  ])

  assert.deepEqual(regions, [
    {start: 30, end: 150, kind: 'sponsor', cues: ["today's sponsor"]},
  ])
})

// Three of the nine sources scored in Step 4 simply stop, with no sign-off
// phrase anywhere. Marking a region there would be inventing one.
test('stays silent on a source that just stops, with no sign-off', () => {
  const regions = detectSkippableRegions([
    {start: 0, text: 'the thing about the borrow checker is that it moves the error earlier'},
    {start: 30, text: 'and thanks to that you stop fighting the iterator loop halfway through'},
    {start: 60, text: 'so, that is where we are at with it for now'},
  ])

  assert.deepEqual(regions, [])
})
