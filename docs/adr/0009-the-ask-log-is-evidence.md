# ADR 0009 — The ask log is evidence, not a corpus

**Date:** 2026-08-05
**Status:** Accepted
**Amends `docs/product-thesis.md` Constraint 4, and amends [ADR 0008](0008-recent-is-artifacts-not-content.md).**

## Context

Constraint 4 named one thing as the line it would not cross:

> Logging *questions asked* would cross it, and would rebuild the corpus this thesis exists to
> have killed.

[ADR 0008](0008-recent-is-artifacts-not-content.md) was written to that line, and held it. The
maintainer then decided the other way, for a reason the constraint does not answer: **the
questions are worth counting later.**

That reason deserves to be taken seriously rather than waved through, because this thesis has
one load-bearing assumption and no evidence for it:

> The load-bearing assumption is now: **people arrive with a question already formed.**
> **One of three sessions did.**

The gate that would have tested it is withdrawn. The thesis says so plainly — *"Yoinks is built
on n=1 and will stay that way"* — and calls every claim below that line a knowing bet. A log of
real questions, written as they are actually typed, is the only instrument that can move that
number without a study, a stranger, or a diary the maintainer fills in while knowing the
hypothesis.

## Decision

**Yoinks writes one line per turn to `~/.config/yoinks/asks.jsonl`.** Append-only, never capped,
never shown on screen.

A line holds: when, the source URL, the source's title, whether it was a question or an
expansion, the question text as typed, how many receipts survived the gate, and how many the
gate dropped.

A line never holds: the gist, any receipt, or any other words the source said. An expansion
records the **second** it asked about rather than the receipt that provoked it — a time is a
pointer into a source, a receipt is the source's content, and only one of those crosses the
line ([ADR 0005](0005-a-fact-that-cannot-be-checked-is-not-shown.md) uses the same distinction
to decide what can be checked).

Two separate files, deliberately:

| | `history.json` | `asks.jsonl` |
|---|---|---|
| read by | the `recent` panel | nothing in the product |
| holds | one row per source, last fifty | one line per turn, all of them |
| answers | "what have I been doing" | "what do I ask, and does the gate fire" |

The panel never draws a question. Anyone reading over your shoulder sees that you asked about a
source, not what you asked.

## Why this is not the corpus that was killed

The corpus the thesis killed was **transcripts of what sources said**, accumulated so the
product could infer from them: the diff for followed creators, cold-start, second-chance
triggers. Every one of those needs the content of past sources, and every one of them fed back
into what Yoinks showed you.

The ask log has neither property. It holds no word any source said, and **nothing in the product
reads it** — `loadAsks` exists for a person with `jq` and a shell, not for a code path. The day
something in `src/` reads this file to decide what to show, that is the corpus returning, and it
needs its own ADR arguing why.

The honest cost, stated rather than buried: this is a record of what a person wanted to know,
and that is more revealing than a list of URLs. It is local, it is plaintext, and it is in a
directory the person can delete. Yoinks holds no account and sends nothing anywhere
([ADR 0002](0002-drive-an-assistant-on-path.md)), so deleting the file is the whole of the
opt-out. `README.md` says where it is.

## What it makes countable

Nothing here promises an analysis. It makes four questions answerable from a shell, which none
of them were before:

- **How often does a question arrive at all** — asks per source yoinked. The thesis' 1-in-3 is
  n=3 from a diary; this is every session, with no diary.
- **What shape are they** — the thesis convicts *"what are the insights from this"* as a
  summary request wearing a question mark, twice, on stated-preference evidence. The log settles
  it with typed words.
- **Does the gate fire, and how often** — `dropped` per turn. Step 7 measured ~1% in a single
  run, and it is the only *measured* difference in [Known cost](../product-thesis.md#known-cost).
- **Do expansions get used** — Constraint 3 was struck partly because nothing had measured
  demand for a second step. Now something can.

## Consequences

- `src/lib/asks.ts` is new: `logAsk` appends, `loadAsks` reads, `askLine` is the pure line
  format and is what the tests hold.
- Every turn lands in `landTurn` (`src/app.tsx`), so questions, follow-ups and expansions are
  all logged the same way — the same place that already checks every turn identically.
- Failures are swallowed. A read-only home directory must not break an answer.
- The thesis' Constraint 4 gains a dated note pointing here. It is not struck: the line it draws
  around *content* is exactly the line this ADR keeps.
