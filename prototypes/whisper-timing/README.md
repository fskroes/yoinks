# PROTOTYPE — does the skippable-region detector survive whisper-derived blocks?

Throwaway. Not imported by `src/`; it imports `src/` rather than the other way round. Built from
the handoff in `/tmp/yoinks-whisper-timing-handoff.md`.

## The question

`src/lib/transcribe.ts` passes `--no-timestamps`, so a source with no captions gives up the words
and none of the marks — `CONTEXT.md` records that as a limit of the domain. It is a limit of the
flag: `whisper-cli -ovtt` writes `00:00:00.000 --> ` cues, which is the shape `CUE_START`
(`src/lib/captions.ts:16`) already parses. So the caption-less source could flow through the
existing `parseCaptions` → `detectSkippableRegions` → `renderTranscript` path unchanged — **if
the detector survives the different text.**

> **Does `detectSkippableRegions` still find the sponsor read and the outro when the blocks come
> from whisper.cpp instead of the platform's captions?**

## Kill condition — named before running

> If whisper blocks find the sponsor read in fewer than 5 of 6 sources, or the outro in fewer
> than 5 of 6, the detector does not transfer. Say so, leave the whisper path untimed, and do not
> tune a cue regex or a threshold to rescue the number.

**Found** means one rule, applied identically to both columns so the comparison is fair — the same
rule `docs/validation/step-6-caption-path.md` scored the caption path with:

- **sponsor found** — a region of kind `sponsor` whose start lands in `[recorded, recorded + 45s]`,
  where *recorded* is the Step 1 slot. One block late is found; any amount early is not. Step 6
  scored source 4 unmatched at −43s on exactly this rule and said why: a literal "within 45
  seconds" rule would call that a match and inflate the result.
- **outro found** — a region of kind `outro` starting on the source's final block. That is what
  Step 1's "every outro is identical" and Step 6's "6 of 6, always the final block" mean.

*Exact* is not scored. Step 6 found the platform's own captions drift 0.6–1.2% in three days and
move block boundaries with them; whisper segments the audio itself and will not agree to the
second with anything. A run that scores exact seconds is measuring the wrong thing.

Recorded is scored as **contained** alongside — did the recorded slot fall inside *any* marked
sponsor region — because that is the more informative number and Step 6 discusses it for source 4.
It is reported, not scored against the kill condition, so this run stays comparable to that one.

A result between "transfers" and "fails" is a finding to write down, not a number to argue with.

## Method — mirror Step 6, swap one rung

Same six video IDs as `docs/validation/step-1-cold-read.md`, the only sources ground truth exists
for. Using sources that *have* captions is the point, not a compromise: running both rungs on the
same source is what isolates the text difference from everything else.

Per source, two columns:

| | Rung under test | Control |
|---|---|---|
| words from | `yt-dlp -f ba/b` → ffmpeg 16k mono → `whisper-cli -ovtt` | `fetchCaptions` (the product's own) |
| then | `parseCaptions` → `detectSkippableRegions` | `parseCaptions` → `detectSkippableRegions` |

Both columns are pulled the same day, so caption drift since Step 6 cannot be mistaken for a
whisper difference. Everything downstream of the VTT is the product's own code, unmodified.

Whisper runs `ggml-base` — the model `ensureWhisperModel` fetches, so this measures what a user
would actually get, not the best whisper can do.

## Where the risk is, in the order it was expected to bite

1. `src/lib/skippable.ts:32` — the cue regexes. Auto-subs are lowercase and unpunctuated; whisper
   writes sentences. `:108` lowercases and strips to word tokens, which absorbs much of it.
2. `src/lib/skippable.ts:152` — `rareIn` scales with block count and `REACH` (`:86`) counts blocks.
   `PARAGRAPH_SECONDS = 45` regroups whisper's ~5–10s segments to the same granularity, so this
   should hold; verify rather than assume.
3. `stripRollingOverlap` is a no-op on whisper VTT — there are no rolling captions. Confirm it
   does not mangle anything.
4. Whisper's word choices differ from the platform's, and the brand-word arithmetic at `:159`
   depends on which words are rare in *this* source. Least predictable of the four.

## Run it

**Nothing to run as of 2026-08-03 — `run.ts` and `npm run prototype:whisper-timing` are deleted;
see [Result](#result--2026-08-03-it-transfers-and-the-kill-condition-as-written-was-measuring-the-wrong-thing).
Kept as the record of what was run to produce the results below.**

Kept unedited below, as the record of how it was run:

```
npm run prototype:whisper-timing              # all six
npm run prototype:whisper-timing -- 32iH1WBJbJo   # one or more IDs
```

Audio, WAV and both VTTs are cached under `$TMPDIR/yoinks-whisper-timing-PROTOTYPE-wipe-me/` so a
re-run costs no network and no whisper. Delete that directory to start clean. Nothing is written
anywhere else; no model, no API key, no assistant on PATH.

## Result — 2026-08-03: it transfers, and the kill condition as written was measuring the wrong thing

**Sponsor 6 of 6, outro 6 of 6 on whisper blocks — the same as the caption control pulled the same
day.** Full numbers, mechanism and caveats in
[`docs/validation/step-9-whisper-timing.md`](../../docs/validation/step-9-whisper-timing.md).

Two things this file got wrong before the run, both recorded rather than edited away:

1. **The kill condition named a metric that is not Step 6's**, and on the metric as written above
   whisper scores 4 of 6 and the condition fires. Step 6's headline `6 of 6` counts source 4 as
   found *while listing it as unmatched*, so found and start-alignment are two questions there,
   not one. The corrected rule reproduces Step 6's caption column exactly; the rule as written
   does not. That is what decides it — see the step-9 write-up, which shows the working rather
   than asserting it.
2. **Risk 1 was guessed wrong.** Casing and punctuation cost nothing. What cost a read was an ASR
   word error: `ggml-base` writes *"today sponsors convex"* where the captions say *"Today's
   sponsor is Convex"*, so the cue does not fire and 96 seconds of mid-roll in the target goes
   unmarked. Left unfixed — widening the regex to catch it is a constant fitted to one
   mis-transcription in one source.

Risks 2 and 3 held. The starts run earlier on whisper (blocks average ~50s against ~46s, because
`paragraphs()` keeps the cue that overshoots 45s and whisper's cues are ~4s against the captions'
~1s), which is `prototypes/map` defect 1 unchanged, not a new one.

The prototype code stays until the change it clears is shipped; delete it then, as
`prototypes/map` was.

**`run.ts` was deleted on 2026-08-03**, along with `npm run prototype:whisper-timing`, once the
change it cleared shipped — the rule directly above, applied. The six-source table in
[`docs/validation/step-9-whisper-timing.md`](../../docs/validation/step-9-whisper-timing.md) is
this script's output and is still what ADR 0004 cites, so the measurement is not reproducible from
the tree any more; git has the script at `994e397`, and re-measuring means restoring it from there.
Three of the six sources were re-run through the product's own path, one of them on the whisper
rung, and that agreed with this script exactly — which is the reason the script itself is no longer
worth keeping next to the code it was checking. What is kept is the evidence: this file.
