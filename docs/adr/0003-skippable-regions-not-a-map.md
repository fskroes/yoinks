# Yoinks marks skippable regions, and does not draw a map

Yoinks marks the parts of a source that are not the source — sponsor reads, subscribe
interruptions, creator outros — in time, each traceable to the line that gave it away. It does
**not** state where a source changes subject, and there is no longer a "map" in the product or
in the language. The questionless arrival gets a transcript with the interruptions marked, and
nothing else.

The word *map* covered both halves and hid the fact that they are different kinds of claim. A
skippable region is a fact: the span says "use code YOINKS", and the transcript line is right
there to check. A segment boundary is an inference about where a subject changes, with nothing
in the transcript to check it against — the tool's opinion about the source's structure,
wearing the same clothes as a fact. [ADR 0001](0001-facts-never-conclusions.md) already forbids
that, and would have cut this term in two on its own.

## Considered options

- **Run the Measure and let it decide.** The gate `docs/product-thesis.md` set: three
  non-maintainers, one week. It is not going to be run — three people's time for a claim whose
  own two measurements already argued against it. Leaving an unrunnable gate standing in the
  document, waiting, was the worse option.
- **Ship the map anyway as an unvalidated bet.** Legitimate; most products are built this way.
  Rejected because it is the *majority* path — two of three arrivals — so an unvalidated bet
  there is a bet on most of the product, and the evidence available runs against rather than
  merely being absent.
- **Keep "map" as the word for the skip marks alone.** Rejected on connotation. A map implies
  you can navigate by it; three ad markers do not let you navigate anything, and keeping the
  word would keep the dead claim alive by suggestion.

## What the evidence actually says

Recorded across `docs/validation/step-4-map-prototype.md` and `step-5-title-falsifier.md`:

- **Skippable regions passed on their own terms.** Sponsor read found in 6 of 6 sources, outro
  in 6 of 6, correctly silent on the three sources with no outro — scored against ground truth
  written down in Step 1 before the builder existed. This is the strongest result in the whole
  validation trail and needs no corpus, no model, and no history.
- **Segment boundaries did not.** Two maps read cold by the maintainer, two whole-source
  questions, the provoking segment recorded as "overall" both times. The mechanism the thesis
  named — *see where the source changes subject, know which part you want, ask for it* — did
  not operate, 2 of 2. Step 5 then ran the title-alone control: a title listing five topics
  produced a request for one of them, with no map involved.

The segmenter is **not disproven** and this ADR does not claim it is. n=2 from the author of
the claim proves nothing. What is decided is narrower and is a decision rather than a finding:
*Yoinks does not ship an unvalidated majority path, and the evidence that would validate this
one is not going to be gathered.*

## Consequences

- **The thesis' Measure is withdrawn, not deferred.** Yoinks is now built on n=1 permanently.
  That is a bet, and it is named here so it stops reading as an experiment still in flight.
- **`topicalBoundaries` in `prototypes/map/build-map.ts` does not get promoted**, and the two
  defects recorded against it — 45-second block granularity, unexploited `>>` speaker markers —
  are not worth fixing. They were never why the readings came out as they did.
- **ADR 0001's second consequence is now stale in its example.** It says the no-question path
  returns a map. It returns marked skippable regions. The constraint it states is untouched;
  only the illustration moved.
- **Expect this to be re-proposed.** Chapter markers are a visible feature in every comparable
  product and the segmenter already exists and works well enough to demo. The answer is that it
  states an opinion the transcript cannot check, and that is ADR 0001's line, not a matter of
  taste or tuning.
