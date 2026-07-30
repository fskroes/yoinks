# Step 4 — does a map provoke a question?

Run 2026-07-29/30, from the handoff at the end of `step-3-grilling.md`. `/prototype` as code:
`prototypes/map/`, throwaway, outside `src/`.

Branch 5 of `docs/product-thesis.md` rests entirely on this. Two of three arrivals have no
question; the thesis' answer for them is a **map**, whose stated job is to make the person see
what is in there and ask for the part they want. It was the cheapest unvalidated claim left —
a map needs no model, no API key, and no assistant on PATH.

## Verdict: survives on its own terms, fails on its mechanism

The kill condition named before the run:

> If reading the map of an unwatched source produces no question — if the honest reaction is
> "just tell me what's in it" — branch 5 is wrong.

It did not fire. Two fresh unwatched sources, two maps read cold, two questions, neither a
summary request. The weaker fatal case — always the same question — was put to the reader and
judged not to apply.

**But the mechanism the thesis names did not operate, 2 of 2.** The thesis says someone
looking at where a source changes subject *"knows which part they want, and asks for it."*
Both readings recorded the provoking segment as **"overall"**. Both questions ask how the
whole source relates to something outside it, and answering either needs the entire transcript
back — the opposite of the narrowing the map exists to do. The questionless arrival was not
converted into the question-shaped case. It became a third thing the thesis has no path for.

| | Source A — default render | Source B — `--strict` |
|---|---|---|
| Question formed | yes | yes |
| Summary request in disguise | no | no |
| Provoking segment | **overall** | **overall** |
| Pre-formed before the map | partly | — |
| Title alone would have done it | — | **cannot say** |

Full record, both maps, and the reader's own wording: `prototypes/map/recording.md`.

## The mechanical half passed, and is the solid result

*Can a usable map be built from auto-subs at all?* Yes. Nine sources — the three from Step 2,
plus Step 1's six re-pulled from the recorded IDs (word counts match Step 1's table to within
0.3%, so the corpus was reproduced, not approximated).

Scored against ground truth Step 1 wrote down — sponsor slots `1:34 / 0:46 / 1:31 / 2:18 /
1:32 / 0:47`:

- Sponsor read found in **6 of 6**; 3 starts exact, 2 within one 45s block, 1 unmatched.
- Outro found in **6 of 6**, always the final 45 seconds. Step 1's "every outro was identical"
  holds.
- Correctly silent on the three Step 2 sources that have no creator outro.

This mirrors Step 1's finding 2, and strengthens it: **skip patterns are the cheap, reliable
part.** They need no corpus, no model, and no history.

## Three findings that bear on the thesis

**1. The title-alone control was never run, and it is now load-bearing.** The `--strict` map
contains no subject matter whatsoever — twenty time ranges, no skippable marks, no verbatim
lines, no terms. It cannot have supplied "AI" to the question it provoked. Everything capable
of producing that question came from the **title**, which is metadata available without Yoinks
existing. Asked directly, the reader could not rule it out, having already read the map.

This run therefore cannot distinguish *"the map provoked a question"* from *"the person read a
title and brought their own."* The doubt reaches back to Source A. Nothing about how the map is
rendered matters until this is settled.

**2. The render made no observable difference.** Verbatim turn lines plus distinctive terms
produced the same question shape, at the same whole-source granularity, with the same "overall"
attribution, as bare time ranges. Either the handles are unnecessary and "structure, never
content" is enough — or neither render did anything and the title did the work twice. This
evidence does not separate the two, and the second is the more damaging.

**3. The skip layer contributed nothing on either fresh source.** Neither contains a sponsor
read or an outro; verified by cue count *before* either map was read. Step 1 measured skip
patterns on one creator's uploads and called them the cheapest and most reliable result of the
whole exercise. Across two long-form interview sources they are simply absent. If the sources
people bring are podcast-shaped, half of what the thesis calls a map is not there to be built.

## Two corrections, recorded rather than applied quietly

Both moved in the direction favourable to the thesis, which is why they are here:

1. Source A's reaction was **filed against the wrong source** — the question named geopolitics,
   which is Source A, while sitting in Source B's table. Credit for it belongs to the default
   render, not `--strict`.
2. Source A's *"is it 'what's this about' in disguise?"* was first marked **yes**, then reversed
   to **no** on review. The tension was put both ways and decided by the reader. The risk that
   this is an upgrade of a vague answer — the move branch 1 of Step 3 convicted — is noted, not
   argued away.

## What Step 4 could not do

It could not run the control that would make its own result mean something, and both sources
are now burned for it. n=2, one person: the maintainer, who wrote the thesis being tested and
knew what was being measured. The Measure in `docs/product-thesis.md` — three non-maintainers,
one week — is not satisfied by this and was never going to be.

Two real defects in the builder were found and deliberately **not** fixed: 45-second block
granularity hides a mid-block interruption (the Economist's mid-roll at `25:40` shares a block
with a real question), and the `>>` speaker markers that carry an interview's structure for
free are unexploited. Neither is the reason the run came out as it did — finer boundaries do
not turn "overall" into "minutes 36 to 46" — and rebuilding the map after an ambiguous reading
is the move the kill condition forbids in advance.

**`docs/product-thesis.md` is untouched.** This is evidence, so it *can* reopen the document,
but two whole-source questions from the thesis' own author with the control unrun is not the
evidence that should.

---

# Handoff → the Measure

Read this cold; it is meant to stand alone.

## The next step is not code

Not `/to-spec`, not `/to-tickets`, not a better map. The gate in `docs/product-thesis.md` —
**three non-maintainers, one week, the Step 2 diary method** — is the next step, and it is not
optional. What Step 4 changed is that the instrument to hand those three people is now known.

## The log, which is the whole deliverable

One line per source, three columns instead of one:

1. **Here is the title. What do you want to ask?**
2. **Here is the map. Does that change?**
3. **Which part do you want?**

Column 2 is the control Step 4 missed — the one thing that separates a map doing work from a
title doing work. Column 3 is what Step 4 says is in doubt: branch 5 lives or dies on people
asking for a *part*, and neither reading produced one.

Run `npm run prototype:map -- <url> --plain` to produce the map for column 2. The prototype is
adequate for this and should not be improved first.

## A cheap falsifier before spending a week of three people's time

Ten minutes: look at two or three **fresh** titles with no map at all and write down what you
want to ask.

This can only kill, never confirm. The maintainer is a burned instrument for this specific
question — the hypothesis is now known, and a positive result is worthless. But the bias runs
toward confirming the thesis, so if *"how does this relate to ⟨thing I already track⟩"* comes
out of bare titles anyway, that is decisive against the map, produced by an instrument tilted
the other way. Same shape as Step 1.

If it kills, three people are saved a week.

## Watch for, do not build for

Both questions asked how the source relates to something the reader already tracks — not
what is in it, not which part. The thesis has no product for that. It has the same texture as
day 3 in Step 2: the sharpest signal in the record, matching neither branch on offer. On n=2
from the author it is a hunch. Put it in the diary log as a thing to notice, and see whether
three strangers do it too.

## Explicitly out of scope until the Measure clears

Unchanged from Step 3's handoff, and this run moved none of it:

- the assistant-on-PATH shell-out (ADR 0002)
- the picker's second group and the two-list refactor (Step 3, branches 6 and 7)
- relaxing the single-positional rule in `src/lib/args.ts`
- the whisper-with-timestamps fallback
- fixing the map's block granularity or its `>>` handling
