# Step 2 — will anyone reach day thirty?

Started 2026-07-28. **Called on 2026-07-29 after 3 days.** Stopped early — the test was
answered by something other than the question it asked. See "Result" at the bottom.

## The question

Step 1 tested whether the diff is *interesting*. It is. But the diff needs a corpus, and the
corpus doesn't exist until weeks of pasting that pay back nothing. That gap is the thing
that kills the product, and no code is needed to feel it.

**The test:** for 7 days, every Theo video you'd have watched anyway — pull the transcript
first. No diff. No output. Nothing back.

**The read:** if you, the most motivated possible user, stop before #4, no stranger reaches
day thirty.

## How

```
~/yoinks-corpus/bin/pull <youtube-url>
```

Prints one line: filename, word count, corpus size. That's the entire reward, and it's
deliberately thin — inflating it would test the wrong thing.

## Log

Fill a row each time. Honesty about the "felt like" column is the whole experiment; a
sanitised log tests nothing.

| Date | Video | Pulled before watching? | Felt like |
|---|---|---|---|
| 2026-07-29 | Theo — Codeberg, are you serious (`Y8cY1DEURtE`, 7,823 w) | yes | "normal, wasn't that much change — actually kind of confused". Opened and read the transcript; found the wall of text confusing, and the video's content confusing too. Asked for nothing. |
| 2026-07-29 | The Economist — full-length Elon Musk interview (`XuoqKYxDHVc`, 15,104 w) | yes | "Interesting, I have listened to the episode and would like to have a summary and insights from the video." |
| 2026-07-29 | Conductor CEO Charlie Holtz — AI coding setup (`fQmlML9Lay4`, 3,523 w) | yes | "I want to know what his setup was, thats why." |

## Day 1 note — don't read the transcripts

The pull is accumulation only. Opening the file is not part of the test.

That the urge was there anyway is itself data. A 7,823-word de-rolled auto-sub is unreadable
by design — consistent with the thesis position that the transcript is a *receipt, not
evidence*. But it means "paste and get nothing back" has a second cost the plan didn't
anticipate: the artifact you accumulate is actively unpleasant to look at, so the folder
reads as a pile of waste rather than a growing asset. Cold-start may be harder than
"unrewarded", it may be mildly aversive.

Watch for this recurring. If the urge to open them fades by day 3, it was novelty. If it
doesn't, the corpus needs to show *something* — a title list, a word count, anything with a
shape — long before the diff arrives.

## Failure is a result

Quitting on day 3 is not the test going wrong — it is the test returning an answer, and the
cheapest answer available. Record the quit and the reason. Do not restart to get a nicer
number.

## Gate

Step 3 (`/grill-with-docs`, landing `creator`/`corpus` in CONTEXT.md, "facts never
conclusions" as an ADR) stays closed until this finishes. So do `/prototype` as code,
`/to-spec`, and `/to-tickets` — each one builds the corpus machinery this step exists to
check for free.

---

# Result — called 2026-07-29, day 3 of 7

## The test never got to run

Step 2 asked: *will you tolerate weeks of unrewarded pasting?* It never found out. The
pasting was fine — 3 for 3, no resistance, no drop-off. The test died because behaviour
around it invalidated the premise it was testing.

## What actually happened

Three pulls, three shapes, and only the first one is the product the thesis describes.

| Day | Source | Followed? | What was wanted |
|---|---|---|---|
| 1 | Theo | yes | nothing — read the raw transcript, found it confusing |
| 2 | The Economist / Musk | **no — stranger** | summary + insights |
| 3 | Charlie Holtz | **no — stranger** | **one specific fact: what was his setup** |

Two of three sources were strangers seen once. Neither will ever have a corpus.

## Finding 1 — the load-bearing assumption failed

`docs/product-thesis.md` names its own kill condition:

> if a person's sources are mostly strangers seen once, the diff and the second-chance
> trigger both lose their substrate and this thesis collapses back to plain summarisation.

Two of the three sources were strangers seen once. The condition fired, on the author's own
viewing, inside 48 hours of writing it down.

This does not say the diff is bad — Step 1 showed it's genuinely good on a followed creator.
It says the diff is a **feature for a minority of sources**, not the product. The corpus
machinery would be built for the one video in three where it applies, and idle for the rest.

## Finding 2 — the real shape is extraction against a question

Day 3 is the sharpest signal in the whole exercise, and it matches neither branch of the
thesis. He wasn't asking for a diff. He wasn't asking for a summary either — day 2 was that,
and it was the weaker of the two.

He had **a question before pressing play**: *what is his setup?* The video was a container
holding an answer. What he wanted was the answer, cited, with the rest thrown away.

That shape needs:
- no corpus
- no creator history
- no accumulation, hence no cold-start problem at all
- one source URL and one question

Every expensive, unvalidated thing in the thesis exists to serve the corpus. The shape the
evidence actually points at doesn't need any of it, and works on day one for a stranger.

## Finding 3 — the transcript is confirmed disposable, and mildly aversive

Day 1: he opened a 7,823-word transcript and bounced off it. That confirms the thesis
position (*receipt, not evidence*) but adds a cost the plan missed — the accumulated
artifact is unpleasant to look at, so a growing corpus reads as a growing pile of waste.
This would have made cold-start worse than "unrewarded". Moot now, but worth keeping.

## What survives from the thesis

- **Facts, never conclusions.** Untouched. Reinforced, if anything: day 3 wanted facts.
- **Transcript as receipt, not evidence.** Confirmed by day 1.
- **Content-dependent depth.** Untouched.
- **No library UI.** Now trivially true — nothing accumulates.
- **Skip patterns.** Step 1 found these are the cheap, reliable result. They survive
  independent of the corpus: sponsor reads and outros are detectable within a single video.

## What dies

- **The diff for followed creators** — as *the product*. Step 1 proved it's interesting;
  Step 2 proved its substrate is a minority case. Demote to a possible later feature.
- **The corpus.** With it: `creator`, accumulation, cold-start, second-chance triggers.
- **Cut 2 in reverse.** The plan assumed the new-creator quotes path would be cut and the
  diff kept. The evidence points the other way round.
- **Summary as the fallback for strangers.** Day 2 got a summary and it was the *less*
  useful of the two stranger sessions. The stranger path isn't summary — it's extraction.

## What to do next

The thesis needs rewriting around one sentence: **a source URL plus a question, answered in
facts, with citations back to timestamps.**

That is a much smaller product than the one in `docs/product-thesis.md`, it has no
cold-start problem, and all three days of evidence point at it.

Step 3 (`/grill-with-docs`) is now worth doing — but on the rewritten thesis, not the
current one. Grilling the current document would sharpen a claim the evidence has already
voted against.

## Caveats

- n=3, one week, one person. The standing `n=1` caveat from `SESSION.md` still holds and is
  arguably worse here.
- The three videos were not a random sample of his viewing; they're what happened to come up
  in three days while he knew he was being measured.
- Days 2 and 3 were both answered by an assistant with the full transcript in context. That
  is *evidence the shape is useful*, not evidence it can be built well or cheaply.
- Stopping at day 3 means the original cold-start question is genuinely unanswered. If the
  corpus ever comes back, this test has to be re-run, not cited.
