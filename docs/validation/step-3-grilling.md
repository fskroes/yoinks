# Step 3 — grilling the rewritten thesis

Run 2026-07-29, immediately after Step 2 was called. `/grill-with-docs` over
`docs/product-thesis.md`, cross-referenced against the shipped code.

## The framing was wrong going in

Step 3 was opened on the grounds that "the thesis has survived contact with reality". It had
not. It was *written from* that contact, two days earlier, by the same person the contact
happened to. Nothing in the rewritten thesis had been tested against anything — which is a
reason for the grilling to be harsher, not a reason to skip it.

## What it resolved

Ten branches, in dependency order. Six of the ten changed the thesis; two produced ADRs; two
were contradictions found in the code rather than in the argument.

| # | Branch | Resolution |
|---|---|---|
| 1 | Evidence | Recount: **1 of 3**, not 2 of 3. The question-shape is not validated |
| 2 | Identity | The **answer** is ephemeral — rendered, printed to stdout on exit, never saved |
| 3 | Inference | Drive an assistant already on PATH. No key, no bill, no chat UI → ADR 0002 |
| 4 | Transcript | Auto-subs first, whisper fallback, sequenced in that order |
| 5 | No question | A **map**, not a précis. Structure over content |
| 6 | Input | Picker stays the front door and gains a non-saving group; `yoinks <url> "question"` as express lane |
| 7 | Types | Two lists, no umbrella term, so the on-disk boundary cannot blur |
| 8 | State | `history.ts` survives; Constraint 4 narrowed to *nothing accumulates about the content* |
| 9 | Measure | Restated around what Yoinks owns; gated on a diary study with three non-maintainers |
| 10 | ADRs | 0001 facts-never-conclusions, 0002 drive-an-assistant-on-path |

### The recount (branch 1)

The rewritten thesis claimed *"people arrive with a question already formed — two of three
sessions did."* The Step 2 log says day 1 wanted nothing and day 2 wanted "summary and
insights". Only day 3 arrived with a formed question.

Counting day 2 as a hit is the move `SESSION.md` §2 had already convicted — *insights* is the
word products use when they don't know what the user will actually ask — and it let day 2
serve as support for the question-shape while simultaneously serving as the argument against
summarisation. The thesis now says one of three, and marks the load-bearing assumption
unvalidated.

### Two contradictions the code found (branches 4 and 8)

**Every timestamp in the evidence came from a transcript source the product doesn't have.**
Constraint 2 requires a timestamp on every claim. `src/lib/transcribe.ts` runs whisper with
`--no-timestamps`, and `src/lib/ytdlp.ts` has no subtitle handling at all. Step 1's citations
came from yt-dlp auto-subs pulled by hand. Resolved by making auto-subs the primary source —
which also fixes a cost nobody had priced: whisper takes minutes, and the competitor is a
ten-second copy-paste.

**The thesis banned per-person history; the product already ships one.** `src/lib/history.ts`
keeps fifty source URLs for ↑-recall. Constraint 4 had conflated "no corpus" with "no state",
and was narrowed to cover content only.

## What Step 3 could not do

It sharpened the thesis; it produced no evidence. The `n=1` caveat standing since `SESSION.md`
is untouched, and branch 1 made it worse rather than better. The thesis is now **frozen** — no
further revision without new evidence.

---

# Handoff → `/prototype`

Read this cold; it is meant to stand alone.

## The design question

**Does a map provoke a question?**

Branch 5 rests entirely on this. Two of three arrivals have no question, and the thesis'
answer for them is a map — segment boundaries with times, plus detected sponsor reads and
outros — whose stated job is to make the person see what's in there and ask for the part they
want. If a map doesn't do that, the majority path collapses back to "tell me what's in it",
which is summarisation, which the evidence already rated weakest. The thesis would then have
no answer for two thirds of the people who open it.

This is the right prototype because it is the cheapest unvalidated claim left: a map needs no
model, no API key, and no assistant on PATH. Step 1 already found the mechanical half nearly
free — the sponsor read landed within the same two-minute window in all six sources, and every
outro was identical.

## What to build

Throwaway. Hand-built or scripted, not in `src/`.

1. Pull auto-subs for a source (`~/yoinks-corpus/bin/pull`, `vtt2txt.py` — both exist from
   Step 2, at `~/yoinks-corpus/bin/`).
2. Produce a map: where the source changes subject, in time, with skippable regions marked.
   Hand-built is fine and probably better — a machine-built map flatters itself, exactly as
   Step 1 noted about the machine-built diff.
3. Look at it. Write down, before doing anything else, whether a question formed and what it
   was.

## The contamination trap

**Do not use the three Step 2 sources for the provocation half.** Those have been watched, and
a question cannot form honestly about a video whose contents are already known. Use them only
for the mechanical half — can a usable map be built from auto-subs at all — where the IDs are
already recorded (`Y8cY1DEURtE`, `XuoqKYxDHVc`, `fQmlML9Lay4`, plus the six in Step 1).

For the provocation half, use **fresh, unwatched sources**, and record the map-reading before
watching.

## Kill condition

Name it before running, as Step 1 and Step 2 both did:

> If reading the map of an unwatched source produces no question — if the honest reaction is
> "just tell me what's in it" — branch 5 is wrong, and the map is not the on-ramp to the
> product. Say so and stop; do not rebuild the map until it feels better.

A weaker but still fatal outcome: a question forms, but it is always the same question
("what's this about"), which is a summary request wearing a question mark.

## Explicitly out of scope

All of it is gated behind the Measure in `docs/product-thesis.md` — three non-maintainers, one
week, the Step 2 diary method — and none of it should be built to answer this design question:

- the assistant-on-PATH shell-out (ADR 0002)
- the picker's second group and the two-list refactor (branches 6 and 7)
- relaxing the single-positional rule in `src/lib/args.ts`
- the whisper-with-timestamps fallback (branch 4 sequenced it second on purpose)

## Vocabulary

Use the terms in `CONTEXT.md`: **source URL**, **artifact**, **transcript**, **map**,
**answer**. A map describes the shape of a source, never what it says. An answer is shown and
thrown away, and is therefore never an artifact. Both ADRs in `docs/adr/` bind this work —
0001 in particular: the map marks structure and skippable regions, and never rates the source.

---

**Answered 2026-07-30 → `step-4-map-prototype.md`.** The kill condition did not fire, but the
mechanism branch 5 names did not operate either: both readings selected no segment. The
title-alone control was never run and is now the load-bearing unknown. Step 4 hands off to the
Measure, not to `/to-spec`.
