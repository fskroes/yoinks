# Step 6 — does the 6/6 survive the product's own code path?

Run 2026-08-01, while shipping option (b) of [issue #5](https://github.com/fskroes/yoinks/issues/5).

Every number behind the skippable-region detector was measured on the output of
`~/yoinks-corpus/bin/pull` — an external script, not in version control, that no user has or
runs. Session (c) promoted the detector into `src/` but could not re-measure the headline
result: only the three Step 2 sources were still on disk. `docs/validation/step-1-cold-read.md`
records all six video IDs, so once the product could fetch captions itself the corpus could be
rebuilt through the code a user actually runs, and scored against ground truth written down
before any builder existed.

That is this step. `fetchCaptions` → `parseCaptions` → `detectSkippableRegions`, no external
script anywhere in the path.

## Verdict: it survives. Sponsor 6 of 6, outro 6 of 6.

| # | ID | Recorded sponsor | Found | Verdict | Outro |
|---|---|---|---|---|---|
| 1 | `32iH1WBJbJo` | 1:34 | 1:36 | within one block (+2s) | 16:34 |
| 2 | `434cG4g5KLE` | 0:46 | 0:46 | **exact** | 23:50 |
| 3 | `xmGY276gEFY` | 1:31 | 1:36 | within one block (+5s) | 19:04 |
| 4 | `IfkBQyWuTOE` | 2:18 | 1:35 | unmatched — see below | 57:00 |
| 5 | `Q4LoxsIwriA` | 1:32 | 1:34 | within one block (+2s) | 41:13 |
| target | `cIgoqAy_Vs8` | 0:47 | 0:47 | **exact** | 44:21 |

Ground-truth slots are read in the order of the Step 1 corpus table's `#` column. The target
row corroborates that reading: Step 1 records its read verbatim as `0:47–2:18`.

Against the prototype's own recorded scoring (`prototypes/map/README.md`):

| | Prototype, 2026-07-29 | Product path, 2026-08-01 |
|---|---|---|
| Sponsor read found | 6 of 6 | **6 of 6** |
| Start exact | 3 (`0:46`, `0:47`, `1:34`) | 2 (`0:46`, `0:47`) |
| Within one 45s block | 2 (`1:35`, `1:36`) | 3 (`1:36`, `1:36`, `1:34`) |
| Unmatched | 1 (recorded `2:18`) | 1 (recorded `2:18`) |
| Outro found | 6 of 6, always the final block | **6 of 6, always the final block** |

Every outro end runs past the source's stated length, because a final region's end is the last
block's start plus the source's own median spacing. That is the estimate `medianSpacing` exists
to make, and it is doing what it says.

**On source 4.** The detector marks two adjacent sponsor regions, `1:35–2:23` and `2:23–5:33`.
The recorded slot `2:18` falls *inside* the first, so the read is marked — what is off is where
the region starts, not whether the read was found. The prototype scored this one as unmatched
and it is scored the same way here so the two runs compare; a literal "within 45 seconds" rule
would call it a match at −43s and inflate the result.

## The Step 2 regression baseline has not moved

Session (c) verified the promoted detector byte-for-byte against the prototype on the three
sources that are on disk. Re-run today, through the same `detectSkippableRegions`:

| Source | Result |
|---|---|
| Codeberg | `sponsor 1:34–3:56` — `"today's sponsor"`, `"quick break"` |
| Conductor | silent |
| Economist | `subscribe` ×3 — `4:00–5:36`, `25:40–27:17`, `57:10–58:48` |

Identical to what session (c) recorded. Those three come from markdown already on disk, so this
exercises the detector and not the new parser.

## The finding worth keeping: YouTube's auto-captions have drifted

The two sources that moved (`1:34`→`1:36`, and source 3's `1:31`→`1:36`) are not a code
difference. `parseCaptions` is a port of `bin/vtt2txt.py`, and on a real 10,728-line VTT the two
produce **byte-identical** output — so the same input gives the same blocks. The input changed:

| # | ID | Step 1 words | Today | Drift |
|---|---|---|---|---|
| 1 | `32iH1WBJbJo` | 3,400 | 3,371 | −0.9% |
| 2 | `434cG4g5KLE` | 5,078 | 5,028 | −1.0% |
| 3 | `xmGY276gEFY` | 4,238 | 4,212 | −0.6% |
| 4 | `IfkBQyWuTOE` | 12,000 | 11,890 | −0.9% |
| 5 | `Q4LoxsIwriA` | 8,886 | 8,815 | −0.8% |
| target | `cIgoqAy_Vs8` | 9,779 | 9,663 | −1.2% |

Uniformly 0.6–1.2% shorter, in one direction, across all six. The prototype re-pulled the same
six on 2026-07-29 and matched Step 1 **to within 0.3%**, which is what let it claim the corpus
was reproduced rather than approximated. Three days later the same IDs come back consistently
shorter. YouTube regenerates auto-captions, and a few seconds of block boundary moves with them.

The consequence for anyone re-running this: **the corpus is not a fixed thing.** A start time
that was exact in July is two seconds off in August, and will drift again. That is an argument
for scoring against "found the read / within a block" rather than against exact seconds, and an
argument against ever tuning a constant to hit an exact recorded second. The detector's
thresholds are already source-relative, which is the property that makes it survive this.

## Both branches were run through the actual CLI

The scores above come from a scratch script calling the same functions. That leaves the wiring
in `src/app.tsx` — filename, phases, cancel, fallback — unexercised, and it has no tests by
design (the handoff rules the wiring out as a test seam). So both branches were driven through
`node dist/cli.js` against real URLs, in a pty, picking `transcript · txt`:

| Source | Captions | Phases seen | Artifact |
|---|---|---|---|
| `32iH1WBJbJo` | yes | `looking for captions…` | `Oh no....txt` — 50 lines, `[m:ss]` throughout, `sponsor 1:36–4:48`, `outro 16:34–end` |
| `1La4QzGeaaQ` | none | `looking for captions…` → `starting download…` → `transcribing with local whisper` | `Peru 8K HDR 60FPS (FUHD).txt` — flat text, no stamps, no marks |

The second is the fallback that design call 3 requires to preserve today's behaviour exactly,
and it does: same header, same flat body, nothing marked. It is the branch with no captions to
mark against, and it declines to mark rather than marking against times it does not have.

The caption branch needs no audio download and no whisper, so it finishes in a few seconds
against the minutes the fallback takes.

## What this is not

It is not a test. It needs the network and YouTube, so it cannot live in `npm test`; it was run
as a scratch script and these are its numbers. Nothing here re-opens ADR 0003, and nothing here
says the marks are worth having — Step 1's finding that two of the fresh Step 4/5 sources
contained no sponsor read and no outro at all still stands, and is still the open question about
how much this feature is worth.
