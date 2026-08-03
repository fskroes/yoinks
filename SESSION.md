# Session: from a complaint to a product thesis

2026-07-25. A working session that started with one sentence of friction and ended with
`docs/product-thesis.md`. Recorded because the reasoning matters more than the conclusion.

**Historical record. Control-checked 2026-08-03 against `docs/validation/step-1`–`step-8`,
`docs/adr/0001`–`0005` and the current `docs/product-thesis.md` — see [§8](#8-control-check-2026-08-03).
Sections 1–7 are as written on the day and are not corrected in place.**

---

## 1. The starting complaint

> "When I post a link and I have a transcribe, then I need to leave the application to go
> and see the transcription and put it into a different app to ask for a summary and get
> insights from that transcription."

Generic version of the same thing:

> The app gives me the transcript, but not the understanding. To get that, I have to leave.

Flattest form: **the output is a dead end.** Nothing happens to it inside the app.

First reading offered — and later shown to be lazy: *the app produces raw material, and the
value is one step past where it stops.*

---

## 2. "Where am I agreeing with the consensus without earning it?"

Six borrowed assumptions, including one handed over in the previous answer:

1. **"Summary and insights."** *Insights* is the word products use when they don't know
   what the user will actually ask. The noun was inherited, not the need.
2. **That leaving is friction worth removing.** Real cost is ~10 seconds of copy-paste.
   Consensus treats every context switch as a defect; nobody checked whether this one is
   painful or merely noticeable.
3. **That the transcript is raw material.** It might be the deliverable, with the thinking
   belonging to whatever tool the person already lives in.
4. **n=1, generalised in one sentence.** "I need to leave" became a user need with nobody
   else's annoyance behind it.
5. **That the LLM step belongs here.** Shipping a chat panel means competing with the exact
   app the person was going to paste into, on its strongest axis.
6. **That the fix is a feature, not an export.** "Open in Claude, transcript preloaded" is
   one button and concedes nothing.

The question that would settle it: **what did you actually type into the other app?**
"Summarize this" → consensus rails. "Where does he talk about X" → search and navigation, a
different product.

---

## 3. Five questions and the answers

| # | Question | Answer |
|---|---|---|
| 1 | What was the last transcript doing 24 hours later? | Used it, then done with it. |
| 2 | Getting the content, or permission not to watch? | Get the content, summarise, then decide whether the video is worth watching — and whether to deep dive after that. |
| 3 | Smallest number of words that would satisfy you? | Hard to measure; depends on the content. |
| 4 | Many strangers once each, or the same person repeatedly? | A lot of the time the same person, but new people too. |
| 5 | Would you trust an answer without seeing the transcript? | Yes. Could question the answer. |

### What the answers established

- **The transcript is disposable.** One decision, roughly a day, gone. No archive, no
  folders, no tags — that whole feature class is waste.
- **The real job is deciding whether to watch.** The competitor isn't another transcription
  tool or a chat app; it's *not watching at all*.
- **The transcript is a receipt, not up-front evidence.** Wanted only at the moment of
  doubt, at the line that caused it.
- **No single summary length is correct.** Depth has to expand on demand.

**The inversion:** the session opened with "the transcript is my output, the summary is the
missing step." The answers say the transcript is *machinery* and the decision is the output.

---

## 4. The correction that reshaped it

Proposed: make the output a verdict, and measure regret — how often it made you skip
something good or sit through something you resented.

> "I will decide self if I find it valueable to watch the video or not."

That killed the verdict framing. New line: **facts about the content, never conclusions
about it.**

- **Out:** worth-watching scores, recommendations, the regret metric.
- **Survives, because factual:** the diff, verbatim quotes, expandable depth.
- **New measure:** time to a confident decision the person made themselves.

---

## 5. The mixed-sources answer splits the product in two

**Known creator → a diff, not a summary.** "You've already heard most of this from them;
minutes 12–19 are new." Factual, so it respects the constraint. Needs the accumulated
corpus — which is exactly why pasting into an external chat app can't produce it. Same
mechanism yields per-creator skip patterns for free.

**New creator → quotes, not a summary.** The question is whether the *person* is worth
attention, and that's judged by voice. A summary launders voice out; it makes a weak
thinker and a strong one read identically well.

**Reconciles the disposability finding:** the transcript is thrown away, the model of the
creator is kept — invisibly, for the app's use, never surfaced as a library.

**Known cost:** worse than a plain summariser on day one, better on day thirty. Accepted,
because it's also the only part that can't be replicated by copy-paste.

---

## 6. "It's hard to know what you don't know"

The two failure modes aren't symmetric:

- **Watched it and resented it** — knowable. You were there. Instrument it.
- **Skipped something good** — unknowable by construction. You never watched, so you never
  learn you were wrong. No pre-watch summary reaches this.

So don't try to make the decision correct — **make it reversible.** The corpus already
retains what was skipped, so a later trigger (a search, another creator raising the topic)
can surface *"you passed on a source about this three weeks ago."* **Relevance usually
arrives after the decision, not before it.**

---

## 7. Output and next steps

Written: `docs/product-thesis.md` — job, constraints, what they make possible, measure,
known cost, and an explicit `Evidence` section naming the assumption that would sink it.

Deliberately not written: `CONTEXT.md` glossary entries or an ADR. Nothing is settled
terminology or a hard decision yet.

Routing decided via `/ask-matt`:

1. **`/prototype`** first — the thesis rests on one falsifiable claim (a diff beats a
   summary). Hand-produce a diff from five transcripts of one followed creator and look at
   it. If it's boring, the thesis collapses and the corpus infrastructure was never needed.
2. **`/grill-with-docs`** after — stateful, lands `creator` and `corpus` in `CONTEXT.md`
   and "facts, never conclusions" as an ADR. (`/domain-modeling` alone is the narrower
   version.)
3. **Not yet:** `/to-spec` and `/to-tickets` would specify an unvalidated assumption.
   `/wayfinder` only if the prototype survives and the build turns out foggier than it
   reads.

**Standing caveat:** n=1 throughout. Grilling sharpens the thesis; it can't tell you whether
anyone else follows five creators the way this person does.

---

## 8. Control-check, 2026-08-03

Added nine days later. Every claim above scored against what has since been measured. The body
is untouched — a session log corrected in place stops being evidence of anything.

**The doubts outlived the design.** §2 was written as skepticism about six borrowed
assumptions; later work resolved all six explicitly — three in favour, one split, one rejected
by decision, one still open and now the thesis' own *Known cost*. §5 and §6 are where the
session proposed an actual product. **None of it exists**, and its central claim was inverted
rather than merely dropped.

### §1–§2 — the complaint and the six assumptions

| Claim | Verdict | Where |
|---|---|---|
| The output is a dead end | Held, and closed. An answer is produced in Yoinks and discarded there | [ADR 0002](docs/adr/0002-drive-an-assistant-on-path.md) |
| "The app produces raw material; the value is one step past where it stops" | Half wrong, as §1 suspected. The transcript is also a deliverable: timed, marked, saved | [ADR 0004](docs/adr/0004-the-transcript-artifact-is-timed-and-marked.md) |
| 1. *insights* is the word for a need nobody has named | **Held, three times** — day 2 of the diary, the recount that dropped the thesis' own evidence from 2/3 to 1/3, and source 2 of the title control | [step 2](docs/validation/step-2-cold-start.md), [step 3](docs/validation/step-3-grilling.md), [step 5](docs/validation/step-5-title-falsifier.md) |
| 2. Leaving costs ~10 seconds and may not be worth removing | **Still open**, and now the thesis' own *Known cost*. The Measure had to be restated once nobody pastes anything: what Yoinks owns is keeping fifteen thousand words off a clipboard | `product-thesis.md` |
| 3. The transcript might be the deliverable | Held, and built | [ADR 0004](docs/adr/0004-the-transcript-artifact-is-timed-and-marked.md) |
| 4. n=1, generalised in one sentence | Held, and made permanent by decision on 2026-08-01 rather than resolved | [ADR 0003](docs/adr/0003-skippable-regions-not-a-map.md) |
| 5. The LLM step may not belong here | Split. No chat panel, no key, no bill — an assistant already on PATH | [ADR 0002](docs/adr/0002-drive-an-assistant-on-path.md) |
| 6. The fix is an export, not a feature | **Rejected by decision.** Named there as "the 2026-07-25 session's preferred answer": the answer would live in someone else's window | [ADR 0002](docs/adr/0002-drive-an-assistant-on-path.md) |

§2's closing question — *what did you actually type into the other app?* — is the instrument
everything downstream came out of. Day 3 of the diary answered it: *what is his setup?* The
session predicted that answer would mean a different product. It did.

### §3 — the five questions

| Claim | Verdict | Where |
|---|---|---|
| The transcript is disposable; archive, folders and tags are waste | Held → Constraint 4 | [step 2](docs/validation/step-2-cold-start.md) |
| The transcript is a receipt, not up-front evidence | Held → Constraint 2 | [step 2](docs/validation/step-2-cold-start.md) finding 3 |
| No single summary length is correct; depth expands on demand | **Struck 2026-08-03**, by this control-check. It stood as Constraint 3 and nothing expands: an answer is at most five facts and then it is over. Its origin is Q3 below — a stated-preference answer — and the one measurement that touched it went the other way | [step 7](docs/validation/step-7-answering.md), `product-thesis.md` Constraint 3 |
| **The real job is deciding whether to watch; the competitor is not watching at all** | **Falsified.** Day 3 arrived with a question already formed and the source as a container holding the answer. The thesis' job statement has no watch decision in it | [step 2](docs/validation/step-2-cold-start.md) finding 2 |
| The inversion: the transcript is machinery, the decision is the output | Both halves gone. §4 killed the decision-as-output later the same day; ADR 0004 then made the transcript a deliverable rather than machinery | — |

One methodological finding worth keeping: §3 is five **stated-preference** answers, and Q2's —
*get the content, summarise, then decide* — is the summarise-then-decide move §2.1 had convicted
three paragraphs earlier. The session took it at face value anyway. The diary contradicted it
within four days. Where stated preference and the diary disagreed, the diary won every time.

### §4 — facts, never conclusions

| Claim | Verdict | Where |
|---|---|---|
| Facts about the content, never conclusions about it | **Held, and the most load-bearing line in the repo.** It cut the map, it is why a mark says *skippable* and never *skip this*, and it is why an uncheckable fact is dropped | [ADR 0001](docs/adr/0001-facts-never-conclusions.md), cited by 0003, 0004, 0005 |
| Out: worth-watching scores, recommendations, the regret metric | Still out | [ADR 0001](docs/adr/0001-facts-never-conclusions.md) |
| Survives because factual: verbatim quotes | Held and measured — 94% mean verbatim overlap with the cited block | [step 7](docs/validation/step-7-answering.md) |
| Survives because factual: the diff | Demoted (see §5) | [step 2](docs/validation/step-2-cold-start.md) |
| Survives because factual: expandable depth | Struck, see §3 above | `product-thesis.md` Constraint 3 |
| New measure: time to a confident decision the person made themselves | **Replaced.** The Measure is now whether they got what they came for without handling the transcript | `product-thesis.md` |

### §5 — the split that was the session's actual product

| Claim | Verdict | Where |
|---|---|---|
| Known creator → a diff | Interesting, then demoted. 3/3 on the cheap falsifier, with discounts; then two of three sources were strangers seen once, so the substrate is a minority case | [step 1](docs/validation/step-1-cold-read.md), [step 2](docs/validation/step-2-cold-start.md) |
| The diff can subtract what you have already heard | **Defect, unresolved.** What you have heard is sometimes load-bearing scaffolding for what you have not; subtract it and the new part is unreadable | [step 1](docs/validation/step-1-cold-read.md) finding 1 |
| New creator → quotes, because voice is how you judge the person | The quotes survive; the reason does not. *Is this person worth attention* is a worth-watching judgment ADR 0001 forbids | [ADR 0001](docs/adr/0001-facts-never-conclusions.md) |
| The transcript is thrown away, the model of the creator is kept | **Dead, and inverted.** Nothing accumulates about content; the transcript is the thing a person keeps | Constraint 4, [ADR 0004](docs/adr/0004-the-transcript-artifact-is-timed-and-marked.md) |
| Worse on day one, better on day thirty | **Dead and never tested.** The diary was called on day 3 for an unrelated reason; cold-start is genuinely unanswered and would have to be re-run, not cited | [step 2](docs/validation/step-2-cold-start.md) |
| The corpus is the only part copy-paste cannot replicate | **Inverted.** The thesis now says in its own words: the old thesis had a real moat and this one gives it up | `product-thesis.md`, *Known cost* |

Skip patterns — named here as a free by-product of the diff machinery — outlived everything
they were a by-product of. Sponsor read 6 of 6, outro 6 of 6, twice: once in the prototype,
once through the product's own code path. It is the strongest result in the trail, and §5
mentions it in half a sentence.

### §6 — reversibility

| Claim | Verdict |
|---|---|
| The two failure modes are asymmetric; skipping something good is unknowable by construction | Still true, still unaddressed. Nothing in the product reaches it |
| Make the decision reversible with a second-chance trigger | Dead with the corpus; listed under *Deliberately not doing* |
| Relevance usually arrives after the decision, not before it | Untouched by any evidence, and no longer has a mechanism. The one idea here that neither died nor shipped |

### §7 — the routing

| Step | What happened |
|---|---|
| 1. `/prototype` the diff, five transcripts of one followed creator | Ran as [step 1](docs/validation/step-1-cold-read.md) — machine-built rather than hand-built, which that step records as its first discount. **But the falsifiable claim this routing named — *a diff beats a summary* — was never run head to head.** Step 1 scored the diff on three questions with no summary control. It is now moot: the diff was demoted for substrate, not for losing a comparison |
| 2. `/grill-with-docs` after | Ran as [step 3](docs/validation/step-3-grilling.md). It predicted two outputs and produced exactly those two: ADR 0001 and ADR 0002 |
| …landing `creator` and `corpus` in `CONTEXT.md` | Did not happen, correctly — both were dead by then. The glossary's seven terms include none from this session |
| 3. Not yet: `/to-spec`, `/to-tickets`, `/wayfinder` | Still not run |
| "Deliberately not written: glossary entries or an ADR. Nothing is settled yet" | Stale. Seven glossary terms, five ADRs |

`/prototype` also ran a second time, on the map ([step 4](docs/validation/step-4-map-prototype.md)) —
handed off by step 3, not by this routing, for a claim that did not exist on 2026-07-25.

### What this control-check is not

It re-reads documents; it runs nothing. Every step it scores against is the same person, so
*held* here means a claim survived the maintainer's own further work — not that anyone checked
it. The standing caveat above covers this section too, and the gate that could have lifted it
has been withdrawn.
