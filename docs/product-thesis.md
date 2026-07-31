# Product Thesis: Answering a Question About a Source

Working thesis about what a person wants after Yoinks produces a transcript. Provisional — see [Evidence](#evidence).

Uses the vocabulary in `CONTEXT.md`: **source URL**, **artifact**, **transcript**, **map**,
**answer**. Constrained by [ADR 0001](adr/0001-facts-never-conclusions.md) and
[ADR 0002](adr/0002-drive-an-assistant-on-path.md).

Supersedes the 2026-07-25 corpus/diff thesis, which was tested and largely falsified. See
[What changed and why](#what-changed-and-why).

**Status: frozen 2026-07-29, reopened at Constraint 5 on 2026-07-31 by evidence.** Frozen means
no further revision from the armchair. This document had already been rewritten twice: once
from evidence (Step 2), once from grilling (Step 3, same day, no new evidence in between). A
third pass without new evidence would have been fitting theory to theory. The previous thesis
died the right way, contradicted by reality inside 48 hours; this one gets the same treatment
or none. Everything durable has been drained out of it — vocabulary into `CONTEXT.md`,
decisions into `docs/adr/`, the gate into [Measure](#measure). Only evidence reopens it.

**What reopened it.** `docs/validation/step-5-title-falsifier.md` ran the title-alone control
that Step 4 could not, and it fired: a bare title produced the relate-to-what-I-track question,
and a title that enumerates topics produced a request for one *part* — the narrowing the map
exists to do, without a map. Constraint 5 and [What this makes possible](#what-this-makes-possible)
are amended below. Nothing else in this document is touched, and the amendment narrows the
claim rather than replacing it: the armchair rule still holds for everything the evidence did
not reach.

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

**5. Most people arrive without a question. Whether a map is the answer is now the open
question, not the answer.**
An earlier draft called the questionless arrival degenerate. The evidence says it is the
majority: two of three. Handing that majority an unasked-for account of the content is
summarisation with better manners, and it is the session the evidence rates worst. That much
holds. The proposed answer was to hand back the *shape* of the source — segments, times, the
parts worth skipping — so the person could see what is in there and ask for the part they want.

**Step 5 took the "so" out of that sentence.** The title alone already does the work on sources
whose titles carry subject matter: a five-word title produced a question, and a title listing
five topics produced a request for one of them. Meanwhile Step 4 put a real map in front of two
questionless arrivals and both came back **"overall"** — no narrowing at all. So the constraint
now reads:

> Where the title carries subject matter, the map has no established job — the title is doing
> it. Where the title carries none, the map is the only candidate, and it is precisely there
> that Step 4 measured it failing to narrow.

Branch 5 is therefore reduced to one testable claim: **does a map beat a title, on sources
whose titles carry nothing?** Neither run has yet produced a case where it does. Until one
exists, the map is not the answer to the questionless arrival — it is the untested hypothesis
about it.

## What this makes possible

**A question against one source → cited facts.**
"His setup: $20 gooseneck mic [0:00], 128 GB RAM for local models [3:57], Parakeet via
Spokenly for dictation [3:57], fast mode always [4:45]." Facts, timestamped, everything else
discarded. Works on the first video from a person never seen before.

**No question → a map of the source.**
The majority case. Where the segments begin and end, in time, with sponsor reads, subscribe
interruptions and outros marked as skippable. Structure, never content — so it cannot drift
into summarisation, and so a weak thinker and a strong one are not flattened into the same
competent prose. A map is also the cheapest thing here: it is arithmetic over a timed
transcript, so it can render immediately while an answer waits on a model.

Its claimed work was provoking the question: someone looking at where a source changes subject
knows which part they want and asks for it, turning the questionless majority into the case
above rather than serving them a worse chat application. **That mechanism has been measured
twice and has not operated.** Step 4, two map readings, both "overall". Step 5, four titles and
no map, one clean part request. A topic-listing title is already a low-resolution map, and on
the record so far it narrows better than the built one.

What survives is the mechanical half, which is solid: a usable map *can* be built from auto-subs
(Step 4, nine sources), and the skip layer scores 6/6 on sponsor reads and outros where they
exist. That is a working instrument. It is not evidence that anyone wants it.

**Skip patterns, within a single source.**
Sponsor reads, subscribe interruptions, and outros are structurally detectable inside one
transcript — the sponsor read landed within the same two-minute window in all six sources in
Step 1, and every outro was identical. This was the cheapest and most reliable result of the
whole validation exercise, it needs no history at all, and it is now part of the map rather
than a by-product of machinery that no longer exists.

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
transcript, marking the shape of the source, and keeping fifteen thousand words off a human's
clipboard. The model was always going to be somebody else's.

**How it gets measured.** Not in the product: nothing may log what was asked (see Constraint
4). By repeating the Step 2 diary method with **people who are not the maintainer** — three of
them, a week, one line per source.

The log is four columns, not one. Step 4 designed three on the assumption that the title was
inert; Step 5 showed it is not, so column 1 is load-bearing and column 4 exists to separate the
map's contribution from the title's:

1. **Here is the title. What do you want to ask?**
2. **Here is the map. Does that change?**
3. **Which part do you want?**
4. **Did the map add anything the title had not already given you?**

Column 1 must be answered and written down *before* the map is shown — that ordering is the
whole control, and Step 4 failed for want of it. Record the title verbatim alongside the
answer; whether it enumerates topics is the variable Step 5 says predicts the question.

The map for column 2 comes from `npm run prototype:map -- <url> --plain`. The prototype is
adequate and should not be improved first — its known defects (45-second block granularity,
unexploited `>>` speaker markers) are not why either run came out as it did.

This is the gate, and it is not optional. Every document in this repository carries the same
`n=1` caveat, and the load-bearing assumption is down to a single observation. A fourth round
of the maintainer watching themselves cannot move it; he already knows what he does. The next
real evidence costs three other people and a week, using a method that has now worked twice.

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
is worth anything as confirmation, and a sixth maintainer round would be worth less. Only the
[Measure](#measure) moves this.

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
