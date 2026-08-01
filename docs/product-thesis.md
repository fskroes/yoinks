# Product Thesis: Answering a Question About a Source

Working thesis about what a person wants after Yoinks produces a transcript. Provisional — see [Evidence](#evidence).

Uses the vocabulary in `CONTEXT.md`: **source URL**, **artifact**, **transcript**, **skippable
region**, **answer**. Constrained by [ADR 0001](adr/0001-facts-never-conclusions.md),
[ADR 0002](adr/0002-drive-an-assistant-on-path.md) and
[ADR 0003](adr/0003-skippable-regions-not-a-map.md).

Supersedes the 2026-07-25 corpus/diff thesis, which was tested and largely falsified. See
[What changed and why](#what-changed-and-why).

**Status: frozen 2026-07-29. Reopened 2026-07-31 by evidence, resolved 2026-08-01 by decision,
and frozen again.** Frozen means no further revision from the armchair. This document had
already been rewritten twice before that: once from evidence (Step 2), once from grilling
(Step 3, same day, no new evidence in between). The previous thesis died the right way,
contradicted by reality inside 48 hours; this one gets the same treatment or none. Everything
durable has been drained out of it — vocabulary into `CONTEXT.md`, decisions into `docs/adr/`.

**What happened on 31 July and 1 August.** `docs/validation/step-5-title-falsifier.md` ran the
title-alone control Step 4 could not, and it fired: a title listing five topics produced a
request for one of them, with no map involved. That reopened Constraint 5. It was then closed —
not by further evidence, but by a decision, because the gate that would have produced further
evidence is withdrawn. See [ADR 0003](adr/0003-skippable-regions-not-a-map.md) and
[Measure](#measure). The map is gone from the product and from the language.

**Read this next, before anything else here:** the [Measure](#measure) section no longer
contains a gate. Yoinks is built on n=1, permanently and by choice. Nothing in this document
is waiting to be checked by anyone.

## The job

A person posts a source URL and gets a transcript. They then leave Yoinks and paste the
transcript into another application.

The obvious reading is "Yoinks is missing a summarise step." What they actually do there is
narrower than summarising:

> They arrive with a question. The source media is a container that holds the answer. They
> want the answer, in facts, with a pointer back to where it came from — and the rest thrown
> away.

When the question exists, it is formed *before* pressing play: *what was his setup?* *did
they say anything about pricing?* *what's actually new here?* How often it exists is the
open question this thesis rests on — see [Evidence](#evidence). "What is this and is it
worth my time" is **not** counted as a formed question here; treating it as one is how a
question-shaped product quietly becomes a summariser.

Consequence: the transcript is disposable. Its life is one question, roughly a day. So is
almost everything else Yoinks holds — nothing needs to accumulate for this to work.

## Constraints

**1. Facts, never conclusions.**
No worth-watching score, no recommendation, no verdict. The person decides for themselves.
Yoinks states observations about the content and stops.

**2. The transcript is a receipt, not evidence up front.**
The person will trust an answer without reading the transcript, but will want to question
it. So: hidden by default, reachable at the specific line that provoked the doubt. Every
claim carries a timestamp; the timestamp is the affordance for doubt, not decoration.

**3. Depth is content-dependent.**
There is no correct answer length. Gist expands to detail on demand, one step at a time.

**4. Nothing accumulates about the content.**
No library of transcripts, no folders, no tags, no archive, nothing retained about what any
source said. They asked about one source URL; they get an answer about one source URL, and it
works the first time, on a stranger, with no history to draw on.

An earlier draft said "no per-person history", which was overstated and which the shipped code
already contradicted: `src/lib/history.ts` keeps the last fifty source URLs for ↑-recall in the
URL field. That is input convenience — it holds nothing about what a source said and feeds no
inference. The line to hold is content, not state. Logging *questions asked* would cross it,
and would rebuild the corpus this thesis exists to have killed.

**5. Most people arrive without a question, and Yoinks has no special answer for them.**
An earlier draft called the questionless arrival degenerate. The evidence says it is the
majority: two of three. Handing that majority an unasked-for account of the content is
summarisation with better manners, and it is the session the evidence rates worst. That much
holds, and it is the whole of what this constraint now says.

The proposed answer was a **map** — segment boundaries in time — whose job was to make the
person see what is in there and ask for the part they want. **Resolved against, by decision, in
[ADR 0003](adr/0003-skippable-regions-not-a-map.md).** Two readings produced whole-source
questions and recorded the provoking segment as "overall" both times; Step 5's title-alone
control then produced the part request with no map involved. The evidence is thin — n=2 from
the author — but the gate that would have thickened it is withdrawn, and Yoinks does not ship
an unvalidated majority path.

What the questionless arrival gets is the transcript with its **skippable regions** marked, and
nothing else. That is a smaller claim and a fact-shaped one; see
[What this makes possible](#what-this-makes-possible).

## What this makes possible

**A question against one source → cited facts.**
"His setup: $20 gooseneck mic [0:00], 128 GB RAM for local models [3:57], Parakeet via
Spokenly for dictation [3:57], fast mode always [4:45]." Facts, timestamped, everything else
discarded. Works on the first video from a person never seen before.

**No question → the transcript, with its skippable regions marked.**
The majority case, and a deliberately small answer to it. Sponsor reads, subscribe
interruptions and outros, marked in time, each traceable to the line that gave it away. Nothing
about where the source changes subject — see [ADR 0003](adr/0003-skippable-regions-not-a-map.md)
for why that was cut, and `docs/validation/` for the two runs that cut it.

This is the most reliable thing in the whole validation trail. Sponsor read found in 6 of 6
sources, outro in 6 of 6, correctly silent on the three sources that have no outro — scored
against ground truth Step 1 wrote down before the detector existed. It needs no corpus, no
model, and no history, and it is arithmetic over a timed transcript, so it renders immediately
while an answer waits on a model.

It is also honest about its size. Marking three ad breaks is not a product; it is one useful
mark on a transcript the person was getting anyway. Two of the fresh sources in Steps 4 and 5
contained **no** sponsor read and no outro, so for those this layer contributes nothing at all.
If the sources people bring are podcast-shaped, the questionless arrival gets a bare transcript
and Yoinks has nothing further to offer them. That is the honest state of the majority path.

## Deliberately not doing

**Summarisation as the primary output.** Tested. It was the weakest of the three sessions in
Step 2 — the person had listened to the whole thing already and a summary told them little.
Facts against a question beat it clearly.

**The diff for followed creators.** "You have already heard most of this from them; minutes
12–19 are new." Step 1 confirmed this is genuinely interesting when it applies — it changed a
watch decision, and could not have been guessed from title and thumbnail. But Step 2 found it
applies to a minority of sources: two of three were strangers seen once, who will never have
a history. It is a possible later feature for a heavy-repeat source, not the product. It also
has an unresolved defect: what you have already heard is sometimes load-bearing scaffolding
for what you have not, so subtracting it produces something unreadable.

**Any corpus, and everything that hangs off it.** Accumulation, cold-start, per-person
history, second-chance triggers for skipped sources. All of it existed to serve the diff.
With the diff demoted, none of it is justified, and the hardest unvalidated risk in the old
thesis — weeks of unrewarded pasting before the product does anything — disappears rather
than being solved.

## Measure

Whether the person got what they came for **without ever handling the transcript themselves.**
Not summary quality, not engagement, not whether Yoinks was right — it does not get an opinion.

The earlier wording was "without pasting the transcript somewhere else", which stopped being a
measure once Yoinks started driving an assistant on the person's PATH: nobody pastes anything,
so it passes the moment the feature exists. Measure the part Yoinks owns — obtaining a timed
transcript, marking what in it is not the source, and keeping fifteen thousand words off a
human's clipboard. The model was always going to be somebody else's.

### The gate is withdrawn, 2026-08-01

Earlier versions of this section said: *"This is the gate, and it is not optional."* It named
three non-maintainers, a week, and the Step 2 diary method, and everything downstream waited on
it. **It is not going to be run**, and a gate nobody will open is worse than no gate — it lets
a document keep the posture of an experiment in flight while the experiment is over.

So it is struck rather than deferred, and the consequence is stated plainly instead:

> **Yoinks is built on n=1 and will stay that way.** One person, the author of this document,
> across nine sources and three validation rounds. Nothing here has been checked against a
> stranger, and nothing here is going to be.

That is a bet, and it is [ADR 0003](adr/0003-skippable-regions-not-a-map.md)'s bet. It is not a
defect as long as it is stated; it becomes one the moment any part of this repository implies
otherwise. Every claim below the line of "the transcript came out and the times are right" is
unvalidated, and the two claims that *were* put in front of a measurement — the map provoking
a question, the corpus being worth accumulating — both came back against.

**What still gets measured, without anyone else.** Mechanical claims, against ground truth
written down before the code exists. That is how skippable regions got to 6/6 and 6/6, and it
is the only kind of evidence this project has ever produced that was worth anything. Anything
requiring a human reaction is now a design decision, taken openly, recorded in `docs/adr/`.

## Known cost

Yoinks is now much closer to what a general chat application does with a pasted transcript.
The old thesis had a real moat — no external tool has the corpus — and this one gives it up.
What is left is doing the specific job well: getting the transcript, answering against it in
cited facts, and not making the person carry a wall of text between two applications.

That may not be enough of a difference. It is the open question this thesis does not answer.

## Evidence

Validated 2026-07-27 → 2026-07-31 by the maintainer, on their own use. Full records:

- `docs/validation/step-1-cold-read.md` — the diff is interesting when it applies (3/3 pass,
  with discounts recorded)
- `docs/validation/step-2-cold-start.md` — the corpus premise fails; the extraction shape
  surfaced instead
- `docs/validation/step-3-grilling.md` — the thesis stress-tested against itself, no new
  evidence
- `docs/validation/step-4-map-prototype.md` — a map *can* be built (9 sources, skip patterns
  6/6); the mechanism it claims did not operate, 2 of 2, and the title-alone control went unrun
- `docs/validation/step-5-title-falsifier.md` — the control, run: the title does the work the
  map claimed. Reopened Constraint 5

n=3 sources over three days, one person, non-random sample, and the person knew they were
being measured. Two of the three sessions were answered by an assistant holding the full
transcript in context — that is evidence the *shape* is wanted, not evidence it can be built
well or cheaply. The `n=1` caveat from `SESSION.md` still holds and is arguably worse here.

Steps 4 and 5 add six more sources — two map readings and four titles — and do not relieve
that caveat in the slightest. Same person, the author of the document being tested, who knew
the hypothesis in both runs. They are admitted here because both cut *against* the thesis, and
an instrument tilted toward a claim is worth listening to when it argues the other way. Neither
is worth anything as confirmation, and a sixth maintainer round would be worth less.

**Nothing will move this.** The gate that could have is withdrawn (see [Measure](#measure)).
`n=1` is the permanent state of this document, not a stage it is passing through, and every
claim below should be read as a bet the maintainer is taking knowingly rather than a finding
awaiting confirmation.

The load-bearing assumption is now: **people arrive with a question already formed.**

**One of three sessions did.** The counting matters, so it is spelled out: day 1 wanted
nothing, day 2 wanted "summary and insights", day 3 wanted one specific fact. An earlier
draft of this document scored day 2 as a hit on the grounds that vague curiosity is still a
question. That is the same move `SESSION.md` §2 already convicted — *insights* is the word
products use when they don't know what the user will actually ask — and it let day 2 serve
as support for the question-shape here while serving as the argument against summarisation
in [Deliberately not doing](#deliberately-not-doing). It cannot be both.

So the question-shape is **not validated by this evidence**. It is the sharpest single
observation in the record (day 3, n=1) and the reason to write this thesis rather than the
old one — but the evidence does not yet point at it, and the kill condition named above has
already half-fired on the three days that produced the thesis. If most people arrive with
nothing but a URL and vague curiosity, this collapses back to plain summarisation — the same
failure the previous thesis died of, reached by a different road.

**Step 5 moves this slightly, in the thesis' favour, and the same counting rule is applied.**
Of its three usable titles: one produced a specific part-level question (#3), one produced
*"What is this about?"* and nothing else (#4), and one produced *"what are the insights from
this"* plus a relate-to-my-field question (#2). The middle clause of #2 is scored **not a
question** — it is verbatim the `SESSION.md` §2 move that convicted day 2, and scoring it a hit
here after convicting it there is the failure this document keeps catching itself in. So: 1 of
3 clear, the same ratio as Step 2, on a different set of sources. The assumption is unmoved,
not strengthened — and note that these questions formed *on reading a title*, which is the
realistic arrival and counts, rather than before pressing play as the wording in
[The job](#the-job) implies.

## What changed and why

The 2026-07-25 thesis bet on a corpus of past transcripts per creator, yielding a diff for
familiar sources and quotes for new ones. It named its own kill condition: *if a person's
sources are mostly strangers seen once, the diff and the second-chance trigger both lose
their substrate.*

Two days of the maintainer's own viewing hit that condition — a stranger interview and a
stranger's setup walkthrough, against one followed creator. The condition fired on the
author's own behaviour, 48 hours after being written down.

Cut 2 therefore resolves opposite to the way it was planned: the diff path is the one that
dies, not the new-source path.
