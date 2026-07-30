# Session: from a complaint to a product thesis

2026-07-25. A working session that started with one sentence of friction and ended with
`docs/product-thesis.md`. Recorded because the reasoning matters more than the conclusion.

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
