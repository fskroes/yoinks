# The transcript artifact is timed, and carries its own skip marks

The `.txt` a person saves is a timed transcript. Every block opens with the time it was said,
and where the source interrupts itself the span is marked in place with the verbatim phrase
that gave it away:

```
--- skippable · sponsor · 1:36–4:48
    "today's sponsor"
[1:36] word from today's sponsor. I need to be real with y'all…
```

Before this the artifact was flat prose with no times in it at all.

## Why

`CONTEXT.md` has defined a **Transcript** as timed since the glossary was written — *"every
line carries the time it was said; without that, an answer cannot be checked."* The product
did not produce one. Whisper was invoked with `--no-timestamps` and the file was a wall of
text, so the definition described an intention rather than a thing that existed.

Fetching the platform's own captions closes that gap, because captions arrive timed. Having
closed it, writing the times away again into a flat file would have moved the same
contradiction somewhere new rather than resolving it — the product would hold a timed
transcript in memory and hand the person an untimed one.

The marks come along because they are the only thing the questionless arrival gets
([ADR 0003](0003-skippable-regions-not-a-map.md)) and there is nowhere else to put them. There
is no second surface: no map, no viewer, no assistant. Either the artifact carries them or the
detector runs and nobody ever sees the result.

## Considered options

- **Keep the artifact flat, use the times internally.** Lowest risk, and the file stays clean
  for pasting elsewhere. Rejected because it leaves the glossary contradiction standing while
  making it less visible, and because a detector whose output is never rendered is a detector
  nobody can check.
- **Timestamps, no marks.** Honest, and it defers the marks until the 6/6 had been re-measured
  through the product's own path. Rejected once that measurement was actually run in
  [`step-6-caption-path.md`](../validation/step-6-caption-path.md) — sponsor 6 of 6, outro 6 of
  6, the Step 2 baseline unmoved — which removed the reason to wait.
- **A separate marks file beside the `.txt`.** Two artifacts for one choice, and the picker
  deliberately offers one thing per line (#4). Rejected on that alone.

## Consequences

- **The mark states a fact and shows its working.** The start and the kind are arithmetic; the
  quoted phrase is verbatim from the line that fired. Nothing is scored, ranked or recommended,
  and the reader is handed exactly what they need to disagree — [ADR 0001](0001-facts-never-conclusions.md)
  holds. It says *skippable*, never *skip this*.
- **An estimated end is not printed as a time.** A region's end is normally the next block's
  start, which the source really recorded. The one region that runs past the final block has no
  such time — a transcript records when a line was said, never when it stopped — so the
  detector estimates it from the source's own median spacing. That mark reads `16:34–end`.
  Printing the estimate in the same syntax as the exact ends would dress an inference as a
  fact in the one place a reader cannot check it, which is precisely ADR 0001's line.
- **The 45-second block is now user-visible.** It was an internal granularity; it is now the
  paragraph size of a file people read. It cannot be changed for readability alone — the
  detector's `REACH` and `rareIn` are calibrated to it, and
  `prototypes/map/README.md` defect 1 (a boundary can only land on a 45s edge) is now a defect
  in the artifact too.
- **The fallback branch produces neither.** Whisper still returns untimed text, so a source
  without captions gets a flat file and no marks. That is stated in `CONTEXT.md` rather than
  hidden, and closing it is option (a) of [issue #5](https://github.com/fskroes/yoinks/issues/5),
  which is not done.

  *Closed 2026-08-03.* It was never a property of whisper, only of the `--no-timestamps` flag
  this code passed it. `whisper-cli -ovtt` writes the same `00:00:00.000 --> ` cues the
  platform's captions arrive in, so both rungs now parse through `parseCaptions` to the same
  blocks and the fallback produces the same artifact, marks and all.
  [`step-9-whisper-timing.md`](../validation/step-9-whisper-timing.md) measures the detector
  against whisper-derived blocks on Step 1's six sources — sponsor 6 of 6, outro 6 of 6, the
  same as the caption path scored the same day — with two costs recorded rather than tuned
  away: whisper's blocks run ~50s against the captions' ~46s so region starts land earlier, and
  an ASR word error (*"today sponsors"* for *"Today's sponsor is"*) loses one mid-roll in one
  source. `renderUntimedTranscript` is deleted; there is one artifact again.
- **Expect "just give me clean text" to be asked for.** The answer is that the times are what
  make the file checkable, and checkable is the whole product. A flag is a reasonable thing to
  add; a flat default is not.
