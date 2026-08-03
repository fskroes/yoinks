# Step 7 — can an answer cite the source, or does it just summarise it?

Run 2026-08-03, while building the answering path ([ADR 0002](../adr/0002-drive-an-assistant-on-path.md)).

`CONTEXT.md` defines an **Answer** as *"facts drawn from a transcript, each pointing back to
where in the source media it came from."* That definition only means something if the pointing
back is real. An assistant that returns plausible prose with plausible-looking timestamps
satisfies it to the eye and violates it completely — and unlike a wrong summary, a wrong
citation is invisible at a glance, because it looks exactly like a right one.

The risk was never the plumbing. It was whether an assistant would cite rather than summarise.

## The kill condition, named before the code existed

> **Every fact in an answer carries a timestamp, and that timestamp resolves to a block that
> actually says it.**

Mechanically checkable against a transcript already on disk — no humans, no corpus, which is
the only kind of evidence `docs/product-thesis.md` says this project has ever produced that was
worth anything.

## Verdict: it holds, and the guard it justifies has already caught something

Source: `cIgoqAy_Vs8` (*Opus 5 is my new go-to model*, 57 blocks, 3 skippable regions), through
`fetchCaptions → parseCaptions → detectSkippableRegions → buildPrompt → claude -p → parseFacts`.

Ground truth is `step-1-cold-read.md`, written 2026-07-27 by a human who watched the source,
before any of this code existed. Four questions whose answers it records, and one control it
records nothing for.

| Question | Recorded span | Facts | Landed in span |
|---|---|---|---|
| what does he say about the weekly limit? | 22:46–23:31 | 4 | yes — 22:03, 22:03, 22:50 |
| what does he say about data retention? | 25:02–25:47 | 5 | yes — 24:25, 25:14 ×4 |
| how does he explain distillation? | 16:43–18:15 | 5 | yes — 16:32 ×3, 17:19 ×2 |
| did the model open a browser without being asked? | 33:21–35:38 | 5 | yes — 33:58 ×3, 34:46 ×2 |
| **what does he say about the price of eggs in Peru?** | — | **0** | **declined** ✓ |

- **Landed in the human-recorded span: 4 of 4.**
- **Mean verbatim overlap with the cited block: 94%** — it is quoting, not paraphrasing, which
  is what [ADR 0001](../adr/0001-facts-never-conclusions.md) asks for and what makes a citation
  checkable in the first place.
- **The control declined.** Asked something the source says nothing about, it produced no facts
  rather than inventing any. That was the outcome most likely to be fatal, and it did not fire.

## The finding: it fabricates about 1% of the time, and the guard catches it

Across three runs at different prompt settings — 93 facts in total — **one** carried a
timestamp that is not a block this source has. `parseFacts` dropped it, so it never reached a
person.

That single line is the whole argument for [ADR 0005](../adr/0005-a-fact-that-cannot-be-checked-is-not-shown.md).
At 100% it would have been reasonable to call the guard defensive programming against a problem
that does not occur. At ~1% it is the difference between a product that states facts and one
that states facts *and occasionally makes one up in a way nobody can see*. The rate is low
enough to be invisible in casual use and far too high to leave unguarded.

## Brevity had to be measured too, because the answer has to fit on a screen

The first run had no cap and returned **48** facts across four questions — 14 for one of them.
Every citation resolved, so the kill condition passed, but a screenful of quotes is not an
answer: `docs/product-thesis.md` defines the Measure as *"keeping fifteen thousand words off a
human's clipboard"*, and a wall of text in Yoinks' own window is the same wall.

| Prompt setting | Facts | Resolution | Overlap | In span |
|---|---|---|---|---|
| no cap | 48 | 100% | 96% | 4/4 |
| "fewest, at most 8" | 26 | 100% | 94% | 4/4 |
| **"fewest, at most 5" + shortest span** (ships) | **19** | **95%** | **94%** | **4/4** |

The shipped setting is the one measured last, not the one that scored best — tightening the cap
is what surfaced the fabricated citation, and a number chosen because it scored well on five
questions would be exactly the fitted constant this project keeps refusing to introduce.

## What this is not

It is not a test — it needs the network, YouTube, and an assistant on PATH. It is n=1 in the
sense everything here is: one source, one maintainer, one assistant (`claude`). It says nothing
about whether people want this, only that the mechanism does what `CONTEXT.md` says it does.
Whether an answer is worth more than the transcript it came from is the open question, and it
is not one a script can settle.
