# Step 5 — the title-alone control

Run 2026-07-31, ten minutes, from the falsifier named in the handoff at the end of
`step-4-map-prototype.md`. No code. No map shown, before or after.

Step 4's finding 1: the control that would make its own result mean something was never run,
and it became load-bearing. This is that control — four fresh sources, titles only, question
written before anything else was read.

## Verdict: it fired. Branch 5 of `docs/product-thesis.md` is reopened.

The kill condition, fixed in advance:

> If *"how does this relate to ⟨thing I already track⟩"* comes out of bare titles anyway, that
> is decisive against the map, produced by an instrument tilted the other way.

It came out of bare titles. It also produced something Step 4 said the map could not: a
request for a **part**.

## The log

| # | Title (all that was read) | Len | Question, verbatim | Shape |
|---|---|---|---|---|
| 1 | *Wall Street NYC Quant. bitcoin-fund-manager.com — HOW CITADEL STOLE PRE IPO ANTHROPIC SHARES So Leopold Aschenbrenner …* | 2:08 | "how did this happen and why? How does this effect my stocks? Is this legal and what is the efefct on the market? Did he really had Anthropic pre-ipo shares?" | relate-to-thing-I-track (**contaminated**, see below) |
| 2 | Full Episode: The AI Industrial Revolution | 1:10:02 | "What are the insights from this. Is he saying items about development of software for the future?" | summary request **+** relate-to-thing-I-track |
| 3 | Riding AGI, AI Anxiety, Who Funded COVID, Defending Taiwan, and California Empire | 1:07:52 | "What is he saying about riding AGI?" | **part request** |
| 4 | 'Nothing Ever Happens' Is Over | 19:42 | "What is this about?" | summary request |

Source 1 is not a title. X has no title field; `yt-dlp` returned the first ~100 characters of
the post body, which carries subject matter a YouTube title would not. It cannot serve as the
control and is scored separately. Its question is recorded because it is real, not because it
counts.

## The three findings

**1. The named kill shape came from a clean title.** Source 2's title is five words and names
a subject, nothing more. The reader is a developer; the question asked whether the source bears
on software development — *how does this relate to the thing I already track*. That is the
shape Step 4 flagged as the sharpest signal in its record and had no product for, and it did
not need a map to appear.

**2. A title enumerating topics is already a map, and it did the map's job.** Source 3's title
is a topic list. The question named one of the five and asked for it. Step 4's two map readings
both recorded the provoking segment as **"overall"** and produced whole-source questions; the
narrowing the map exists to do did not happen there. It happened here, with no map, from
metadata available without Yoinks existing.

**3. Question specificity tracks how much subject matter the metadata carries.** Content-rich
(1) → four sharp questions. Topic list (3) → a part request. Bare subject (2) → half summary,
half relate. Bare and non-enumerating (4) → *"What is this about?"*, the literal
just-tell-me-what's-in-it reaction. A map is more subject matter. On this evidence it is
**continuous with the title, not categorically different from it** — which is a different claim
from the one branch 5 makes.

## The double bind this leaves

The map's remaining territory is source 4 — bare title, no question formed, the questionless
arrival branch 5 was written for. That case is 1 of 4 here.

But it is exactly the case Step 4 already tested. When a map *was* put in front of a
questionless arrival, twice, the result was **"overall"** both times. So:

- Where the title is rich, the map is not needed — the question is already specific.
- Where the title is bare, Step 4 says the map did not narrow anyway.

Branch 5 needs a case where the title is too thin to produce a question *and* the map produces
a part request. Neither run has yet shown one.

## What this run does not do

- **n=4, one person, the maintainer.** Same `n=1` caveat as every document here. This can kill,
  it cannot confirm — and it did not need to confirm.
- **The questions were written in one sitting, on request, not at four real arrival moments.**
  Closer to Step 1's cold read than to Step 2's diary.
- **The sources are self-selected toward what the reader already tracks**, so the relate-to
  shape is more available than it would be from a random source. This makes the kill softer
  than the handoff assumed. It does not touch finding 2, which is about narrowing, not subject.
- **No map was shown.** This says the title does more than Step 4 assumed. It does not measure
  what a map would have added on top, and cannot.
- **The scoring was done by the assistant, not the reader.** The four questions are verbatim;
  the shape column is an interpretation and is not a neutral instrument either.

## What is next

The Measure in `docs/product-thesis.md` — three non-maintainers, one week — is unchanged and
still the gate. What changes is the log they are handed. Step 4's three columns assumed the
title was inert; it is not. Column 1 is now the load-bearing one, and a fourth is needed:

1. Here is the title. What do you want to ask?
2. Here is the map. Does that change?
3. Which part do you want?
4. **Did the map add anything the title had not already given you?**

`docs/product-thesis.md` is reopened at branch 5 but **not yet edited**. The thesis says only
evidence reopens it; this is evidence, on the exact control Step 4 could not run, from an
instrument tilted toward the thesis. The edit is the reader's call, not the assistant's.
