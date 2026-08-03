# Step 9 — does the 6/6 survive whisper-derived blocks?

Run 2026-08-03, from the prototype in [`prototypes/whisper-timing/`](../../prototypes/whisper-timing/README.md).

`src/lib/transcribe.ts` passes `--no-timestamps`, so a source with no captions gets flat text and
nothing marked. `CONTEXT.md:20` records that as a limit of the domain — *"audio recognised locally
is not yet timed"* — and it is not. It is a limit of one flag. `whisper-cli -ovtt` writes
`00:00:00.000 --> ` cues, the shape `CUE_START` (`src/lib/captions.ts:16`) already parses, so a
caption-less source could flow through `parseCaptions` → `detectSkippableRegions` →
`renderTranscript` unchanged — **if the detector survives the different text.**

That is this step. Same six IDs as [`step-1-cold-read.md`](step-1-cold-read.md), scored against
the slots Step 1 wrote down before any detector existed. Everything downstream of the VTT is the
product's own code, imported unmodified.

## Verdict: it transfers. Sponsor 6 of 6, outro 6 of 6 — the same as the caption path.

| # | ID | Recorded | Whisper | Verdict | Captions | Verdict |
|---|---|---|---|---|---|---|
| 1 | `32iH1WBJbJo` | 1:34 | 0:52 | early — unmatched (−42s) | 1:36 | within one block (+2s) |
| 2 | `434cG4g5KLE` | 0:46 | 0:46 | **exact** | 0:46 | **exact** |
| 3 | `xmGY276gEFY` | 1:31 | 1:36 | within one block (+5s) | 1:36 | within one block (+5s) |
| 4 | `IfkBQyWuTOE` | 2:18 | 1:44 | early — unmatched (−34s) | 1:35 | early — unmatched (−43s) |
| 5 | `Q4LoxsIwriA` | 1:32 | 1:35 | within one block (+3s) | 1:34 | within one block (+2s) |
| target | `cIgoqAy_Vs8` | 0:47 | 0:51 | within one block (+4s) | 0:47 | **exact** |

| | Whisper | Captions | Step 6, captions, 2026-08-01 |
|---|---|---|---|
| Sponsor read found | **6 of 6** | 6 of 6 | 6 of 6 |
| Start exact | 1 | 2 | 2 |
| Within one 45s block | 3 | 3 | 3 |
| Early — unmatched | 2 | 1 | 1 |
| Outro found | **6 of 6, always the final block** | 6 of 6, always the final block | 6 of 6, always the final block |

Both columns were pulled the same day, so caption drift since Step 6 cannot be mistaken for a
whisper difference. The caption column reproduces Step 6's breakdown line for line, which is what
says the two runs are measuring the same thing.

Whisper ran `ggml-base` — the model `ensureWhisperModel` fetches — so this is what a user would
actually get, not the best whisper can do.

## The kill condition fired on the metric as written, and the metric as written was wrong

`prototypes/whisper-timing/README.md` named the kill condition before the run, and named
**found** as *a sponsor region starting in `[recorded, recorded + 45s]`*. On that rule whisper
scores 4 of 6, and the condition fires.

That is not Step 6's rule, and the rule was corrected after seeing the result. The correction is
recorded here rather than quietly applied, because changing a metric after seeing the number it
produces is the exact move that turns a measurement into an argument.

What settles it is that Step 6's own text says what its metric is. Its table lists source 4 as
`unmatched` *and* its headline is `sponsor 6 of 6`, which only holds if found and start-alignment
are two different questions — and the prose says so directly:

> The recorded slot `2:18` falls *inside* the first, so the read is marked — what is off is where
> the region starts, not whether the read was found.

So **found** means the marked region overlaps the read; **exact / within one block / early** is a
separate breakdown of where its start landed. Where two regions cover one read, the one
*containing* the slot is scored — Step 6 scores source 4 at −43s off `1:35–2:23` rather than +5s
off the adjacent `2:23–5:33`, and says why: *"a literal 'within 45 seconds' rule would call it a
match at −43s and inflate the result."*

The check that the corrected rule is Step 6's, and not merely the rule that lets whisper pass, is
the control column: it reproduces Step 6's published 6 of 6 / 2 exact / 3 within / 1 unmatched
exactly. The rule as originally written does not — it scores source 4 as a +5s match off the
second region, contradicting Step 6's own record of that source. **One rule reproduces the
control and one does not**, and that is decided by Step 6's text, not by which column wins.

Under either rule, whisper and captions differ by exactly one source.

## What whisper actually costs: the starts run earlier

Both of whisper's unmatched starts, and every outro that moved, are the same mechanism —
**whisper's blocks are coarser, so region starts land earlier.**

`paragraphs()` (`src/lib/captions.ts:103`) flushes when a cue starts 45s past the paragraph's
start, and the cue that triggers the flush is kept. So a block runs 45s *plus one cue*. Auto-sub
cues are about 1s; whisper's are about 4s (source 1: 1,053 caption cues against 260 whisper cues
for the same 17 minutes). Whisper blocks therefore average ~50s against the captions' ~46s, and
the gap compounds:

| # | Whisper blocks | Caption blocks | Whisper words | Caption words | Word diff |
|---|---|---|---|---|---|
| 1 | 20 | 22 | 3,407 | 3,371 | +1.1% |
| 2 | 31 | 31 | 5,018 | 5,028 | −0.2% |
| 3 | 25 | 25 | 4,210 | 4,212 | −0.0% |
| 4 | 66 | 73 | 12,010 | 11,890 | +1.0% |
| 5 | 52 | 53 | 8,807 | 8,815 | −0.1% |
| target | 50 | 57 | 9,641 | 9,663 | −0.2% |

The **words agree within 1.1% on every source** — `ggml-base` and YouTube's auto-captions
transcribe these six to the same content. What differs is where the paragraph edges fall.

**Source 1 is the whole story in two seconds.** The read starts at ~1:36. The caption block edge
is at 1:36 and the whisper edge is at 1:38, so the same cue phrase falls on the later block in one
and the earlier block in the other. A 2-second difference in an edge produces a 44-second
difference in a start:

```
whisper   0:00  0:52  1:38  2:26  3:16  …
captions  0:00  0:48  1:36  2:24  3:11  …
                       ^ the phrase "…word from today's sponsor" sits here
```

This is `prototypes/map/README.md` defect 1 — *"45 seconds is the floor, and it is not fine"* —
unchanged and unfixed, not a new defect the whisper path introduces. The caption path wins source
1 by luck, and Step 6's own finding that auto-captions drift 0.6–1.2% in three days means it may
not win it next month. Neither column earned its start; both inherit it from where a boundary
happened to land.

The outros move the same way and for the same reason: whisper's final block opens earlier (source
1 `16:11` against `16:34`, source 5 `40:50` against `41:13`), so the outro mark swallows a little
more of the source. Every outro is still found, and still on the final block.

## The one real miss: whisper drops a possessive and loses a mid-roll

Step 1 records **two** sponsor reads in the target — `0:47–2:18` and `25:47–27:17`. Step 6's table
tracks one slot per source, so the second has never been scored. It is scored here, and it is the
only place whisper loses a read the captions catch:

| | 0:47 read | 25:47 read |
|---|---|---|
| Captions | `0:47–3:54` **exact** | `26:01–27:37` within one block (+14s) |
| Whisper | `0:51–4:22` within one block (+4s) | **not found** |

The cause is a word, not a boundary. The captions say *"ad real quick. **Today's sponsor** is
Convex"*; `ggml-base` writes *"we'll do another ad real quick **today sponsors** convex"*. The
possessive moves onto the wrong word, so `/\btoday'?s sponsor\b/i` (`src/lib/skippable.ts:34`)
does not fire, and 96 seconds of ad goes unmarked.

This is risk 1 from the prototype README — the cue regexes against whisper's different text —
biting in a way the README did not predict. It guessed the risk was punctuation and casing, which
`tokens()` absorbs. The actual risk is **ASR word error on the two or three words a cue depends
on**, and no amount of lowercasing helps with that.

It is left unfixed and untuned. A regex widened to catch `today sponsors` is a constant fitted to
one mis-transcription in one source, which is the property this detector is trusted for not
having. The honest statement of the cost is that the whisper path finds fewer reads than the
caption path on sources that have several, and that a bigger model would move this number — which
is a claim nothing here measures.

## The three risks the prototype named, settled

1. **Cue regexes against whisper's sentences** — *partly bit.* Casing and punctuation cost
   nothing; `tokens()` absorbs them, and `today's sponsor` matched in five of six sources. An ASR
   word error cost one mid-roll. See above.
2. **`rareIn` and `REACH` calibration** — *held.* `PARAGRAPH_SECONDS = 45` regroups whisper's ~4s
   segments to the same granularity, block counts land within 12% of the caption path, and the
   brand-word growth fires on both columns to comparable extents (source 5's `39:14–40:50`
   against `39:40–41:13`; source 2's three regions against three).
3. **`stripRollingOverlap` on whisper VTT** — *no-op, as expected.* Source 1's whisper VTT holds
   3,408 words and comes out of `parseCaptions` with 3,407. One coincidental adjacent duplicate,
   nothing mangled.

A fourth was named as least predictable — whisper's word choices changing which words are rare in
a source, and so where regions grow to. It did not misbehave: whisper's regions end within a block
of the captions' on four of six, and where they differ they are *tighter* (source 4 marks one
`1:44–5:16` where the captions mark `1:35–2:23` plus `2:23–5:33`).

## Both branches were run through the product's own code

The change this measurement cleared is implemented: `transcribe()` returns blocks, both rungs
converge before `renderTranscript`, and `renderUntimedTranscript` is deleted. Driven through the
same functions `app.tsx` calls, in the same order:

| Source | Rung | Result |
|---|---|---|
| `32iH1WBJbJo` | captions | 22 blocks — `sponsor 1:36–4:48`, `outro 16:34–end` |
| `32iH1WBJbJo` | whisper, captions skipped on purpose | 20 blocks — `sponsor 0:52–2:26`, `outro 16:11–end` |
| `1La4QzGeaaQ` | whisper (genuinely has no captions) | *No speech found in this video.* |

The first row is byte-for-byte what `step-6-caption-path.md` recorded for that source, so the
caption path has not moved. The second reproduces this run's own whisper column exactly, so the
product path and the prototype path agree. Both write the same artifact: title, url, `[m:ss]` on
every block, and the marks in place with the phrase that fired them.

**The third row is a source with no speech in it at all** — 8K drone footage over music. Whisper
writes 24 cues and every one of them is `[Music]`, so there is nothing to stamp and the product
says so rather than saving an empty file. Step 6 recorded a flat `.txt` for this source; today's
whisper output would not produce one on the old path either, since `cleanTranscript` also reduced
noise-only lines to the empty string that raised the same error. The difference is in what whisper
returns, not in this change.

**What was not exercised: the ink wiring.** Step 6 drove both branches through `node dist/cli.js`
in a pty. That is not reproduced here — under both `script` and `expect` the picker rendered but
no keystroke ever reached it, so the selection could not be moved off the first choice. Phases,
cancel, and the picker are therefore unverified for this change, exactly as the handoff's rule
that the wiring is not a test seam leaves them. The answer path's new fallback — a caption-less
source now recognises its audio instead of refusing — is the part this most affects, and it has
been read but not run.

## What this is not

It is not a test. It needs the network, YouTube, and whisper.cpp on PATH, so it cannot live in
`npm test`; it was run as a throwaway script and these are its numbers. n=6, one creator, one
language, `ggml-base` only.

It does not say the marks are worth having. Step 1's finding that two of the fresh Step 4/5
sources contained no sponsor read and no outro at all still stands, and is still the open question
about how much this feature is worth.

It does not measure a larger whisper model, and the one miss above is the place where that would
show up.
