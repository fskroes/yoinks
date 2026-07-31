# PROTOTYPE — does a map provoke a question?

Throwaway. Not imported by `src/`. Built from the handoff in
`docs/validation/step-3-grilling.md`.

## The question

Branch 5 of the thesis says most people arrive at a source with no question, and that the
answer for them is a **map** — segment boundaries in time, with skippable regions marked —
whose job is to make them see what is in there and **ask for the part they want**.

If a map doesn't provoke a question, the majority path collapses back to "tell me what's in
it", which is summarisation, which Step 2 rated weakest. So:

> **Does reading the map of a source you have not watched produce a question?**

## Kill condition — named before running

> If reading the map of an unwatched source produces no question — if the honest reaction is
> "just tell me what's in it" — branch 5 is wrong, and the map is not the on-ramp to the
> product. Say so and stop; do not rebuild the map until it feels better.

Weaker but still fatal: a question forms, but it is always the same question ("what's this
about"), which is a summary request wearing a question mark.

## Run it

```
npm run prototype:map -- <transcript.md | youtube-url>
npm run prototype:map -- <...> --strict    # times + skippable regions only
npm run prototype:map -- <...> --plain     # no colour, for pasting into the sheet
```

A URL is pulled with `~/yoinks-corpus/bin/pull` (yt-dlp auto-subs, Step 2's tooling). Nothing
else is written. No model, no API key, no assistant on PATH — the map is arithmetic over a
timed transcript, which is the whole reason this is the cheapest unvalidated claim left.

## The two halves

The handoff splits this, and the split is load-bearing:

- **Mechanical** — *can a usable map be built from auto-subs at all?* Run on sources already
  watched. Done; see below.
- **Provocation** — *does a map provoke a question?* Requires **fresh, unwatched** sources,
  and the reading written down **before** watching. A question cannot form honestly about a
  video whose contents are already known. Not done; see `recording.md`.

## One design decision, made rather than asked

Read literally, a map is "structure, never content" (`CONTEXT.md`, thesis §What this makes
possible). Taken to the letter that is a list of time ranges, and a list of time ranges can
only provoke *"what's in segment 3?"* — which is the weak-fatal outcome the kill condition
already names.

So the default render carries two handles per segment:

- the **verbatim** first whole sentence of the segment — a quote, never a paraphrase, which
  is ADR 0001's own escape hatch ("prefer verbatim over paraphrase"); and
- the terms **distinctive** to that segment versus the rest of the source (tf-idf), which is
  arithmetic, not description.

`--strict` renders the literal reading. Read the two on **different** fresh sources, so the
reading test can say which reading of branch 5 is the one that survives.

Nothing here rates, ranks, or recommends. ADR 0001 holds.

## Result — mechanical half, 2026-07-29

**A usable map can be built from auto-subs.** 9 sources: the three from Step 2, plus Step 1's
six, re-pulled from the recorded IDs into a scratch dir (word counts match Step 1's table to
within 0.3%, so the corpus is reproduced, not approximated).

Scored against ground truth Step 1 wrote down — sponsor slots `1:34 / 0:46 / 1:31 / 2:18 /
1:32 / 0:47`:

| | Result |
|---|---|
| Sponsor read found | **6 of 6** |
| Start exact | 3 of 6 (`0:46`, `0:47`, `1:34`) |
| Start within one 45s block | 2 of 6 (`1:35`, `1:36` vs recorded `1:31`, `1:32`) |
| Unmatched | 1 of 6 (recorded `2:18`) |
| Outro found, always the final 45s | **6 of 6** — Step 1's "every outro was identical" holds |

Correctly **silent** on the three Step 2 sources that have no creator outro. Codeberg's
absence was checked by hand: the transcript contains no sign-off phrase at all.

### Defects, named rather than tuned away

1. **45 seconds is the floor, and it is not fine.** `vtt2txt.py` groups auto-subs into ~45s
   paragraphs, so a boundary can only land on one. The Economist's mid-roll at `25:40` starts
   *mid-block*: the same 45 seconds holds a real question about Sam Altman and the ad that
   interrupts it. Marking the block skippable hides the question. Fixing this means mapping
   from the VTT cues rather than from the pull output — the cues have second resolution and
   are thrown away today.
2. **Skip regions are grown, so they over-reach.** A cue phrase fires once at the top of a
   read; the middle of an ad never says "sponsor". Regions grow forward while the next block
   repeats a word rare elsewhere in the source (an ad repeats its product name). This
   over-grows: Codeberg's Clerk read truly ends at ~`3:12`, the map says `3:56`. Under-growing
   was worse — it leaked ad copy into the next segment's verbatim line.
3. **One surviving false positive.** `IfkBQyWuTOE` at `45:07`. The video is *about* paying for
   AI models, so it says "subscribe to" constantly and means none of it. No phrase list
   separates that from the real CTA in that video. Left in.
4. **Two dead mechanisms were found and replaced, not left in.** Whole-block cosine similarity
   for growing regions never fired once across 9 sources (a seed block is half content, half
   ad, so it resembles its neighbour *less* than the median pair). A bare `\bsponsor\b` matched
   "money I got from sponsors" 36 minutes into Codeberg; `\bsubscribe\b` had the identical bug
   and cost 3 minutes of real content before it was caught.
5. **Interviews are carried by `>>`, not by vocabulary.** The auto-subs mark speaker changes,
   and in an interview the interviewer's question *is* the segment boundary. Lexical cohesion
   finds these only by luck — it caught them in the Economist interview and missed three of
   them in a 16-minute Conductor interview. Not exploited; it is pure structure and it is free.

None of the above was tuned against the three Step 2 sources beyond the first pass. Thresholds
are source-relative (a source's own median, its own document frequencies), not constants
fitted to this corpus — deliberately, because 9 known sources is exactly the sample size that
invites overfitting.

### What this result is not

It is not the answer to the design question. A map that builds is not a map that provokes.

## Result — provocation half, 2026-07-30

**Branch 5 survives on its own terms and fails on its mechanism.** n=2, both maps read cold.
Both produced a question and neither was a summary request, so the kill condition did not fire.
But both questions were whole-source — the provoking segment was **"overall"** twice — so
neither map got the reader to ask for a *part*, which is the conversion branch 5 actually
claims. The strict render did as well as the rich one, which either means the verbatim lines
and terms are unnecessary or means neither render did anything and the title did the work.
The title-alone control was never run and is now the load-bearing unknown.

Full record, both corrections, and caveats in `recording.md`. Nothing here unfreezes
`docs/product-thesis.md`.

## Status — 2026-07-31: do not delete yet

A prototype is throwaway by default: keep the answer, delete the code. This one is held back,
for one reason only — it is the **instrument** for column 2 of the Measure. Three
non-maintainers need a map to read, and `npm run prototype:map -- <url> --plain` is what
produces it.

It should **not** be improved first. Defects 1 and 5 below are real and stay unfixed: finer
block boundaries do not turn *"overall"* into *"minutes 36 to 46"*, and rebuilding the map
after an ambiguous reading is what the kill condition forbids in advance.

Delete it once the Measure clears — either into `src/` if branch 5 survives, or into the bin
if it doesn't.

**The provocation result below was superseded on 2026-07-31.** The title-alone control it
names as the load-bearing unknown was run: `docs/validation/step-5-title-falsifier.md`. It
fired, and it reopened Constraint 5 of `docs/product-thesis.md` — a title listing topics
produced the part request that neither map reading did. Read that file before trusting the
2026-07-30 section as the current state.

## Files

- `build-map.ts` — the keeper. Pure `transcript -> map`. No I/O, no terminal, no model.
- `render.ts` — throwaway. ANSI, one frame.
- `cli.ts` — throwaway shell.
- `recording.md` — the reading sheet. Fill it **before** watching.
