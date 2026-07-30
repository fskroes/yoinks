# Step 1 — the cheap falsifier: is the diff even interesting?

Run 2026-07-27/28. Creator: Theo (@t3dotgg).
Target: "Opus 5 is my new go-to model" (44:29). Corpus: his 5 preceding uploads.

## Verdict: survives

| Question | Answer | Pass |
|---|---|---|
| Would this have changed whether you watched? | yes | ✅ |
| Could you have guessed the new part from title + thumbnail? | no | ✅ |
| Is it boring? | no | ✅ |

Scoring rule was: **no** to 1, or **yes** to 2, or **yes** to 3 → the diff isn't carrying
the product. None triggered.

## Discounts on that verdict

1. **The diff was machine-built, not hand-built.** The original plan required hand-building
   precisely because "you did the corpus work a machine would struggle with." A
   handed-to-you diff flatters itself; an assembled one doesn't. The real margin is
   thinner than three clean passes suggest.
2. **The corpus was picked favourably on purpose.** 4 of the 5 corpus videos share the
   target's AI-model/agentic-coding topic. This was deliberate: it makes a *boring* result
   conclusive. It makes an *interesting* result weak.
3. n=1 throughout, per the standing caveat in SESSION.md.

## The diff, as read

**Already heard from him:** wise-owl / Rottweiler framing; Fable and Mythos are the same
weights; smarter models use fewer tokens; Soul writes too much code; Frontier Code measures
mergeability; Fable burns double the subscription limit; the Soul-deleted-a-home-directory
story; "go try it yourself."

**New (~11 of 44 minutes):**

- **11:23–14:26** — Opus and Fable each judged the *other's* plan better. Soul blind-scored
  Opus 8.3 vs Fable 6.0.
- **22:46–23:31** — Opus draws 100% of the weekly limit vs Fable's 50%. A day's work = 12%
  of the weekly cap on Opus, vs 1.5 weekly limits on Fable.
- **25:02–25:47** — Zero data retention. Fable/Mythos log everything even on enterprise;
  Opus 5 doesn't.
- **16:43–18:15** — Distillation, explained through a "bowl of food" analogy.
- **33:21–35:38** — Opus opened his browser 3× unasked. He blamed his own CLI tool, then
  retracted.

**Skippable:** sponsor reads at 0:47–2:18 and 25:47–27:17.

## Two findings that bear on the thesis

**1. Previously-heard ≠ skippable.** Theo re-explains Fable=Mythos at 20:31 because the new
distillation argument at 16:43 collapses without it. `docs/product-thesis.md` assumes the
diff can subtract what you've already heard. Here, what you've heard is load-bearing
scaffolding for what you haven't — subtract it and the new part is unreadable.

**2. Skip patterns are the cheap, solid result; the novelty diff is the expensive,
contested one.** The sponsor read lands in the same slot in all six videos
(1:34 / 0:46 / 1:31 / 2:18 / 1:32 / 0:47) and every outro is identical — zero judgment
calls, trivially automatable. The novelty diff required a dozen arguable "is this the same
claim restated?" decisions, each a place a machine gets it wrong. The thesis treats skip
patterns as a by-product of the diff machinery. The evidence says the by-product is the
reliable part.

Both findings are unresolved. Neither blocks Step 2. Both are input to Step 3's
`/grill-with-docs`, if it happens.

## Corpus used

| # | Video | Length | Words | ID |
|---|---|---|---|---|
| target | Opus 5 is my new go-to model | 44:29 | 9,779 | `cIgoqAy_Vs8` |
| 4 | Fable 5 vs GPT-5.6 | 57:39 | 12,000 | `IfkBQyWuTOE` |
| 5 | Kimi K3 is the best model ever made (sometimes) | 41:35 | 8,886 | `Q4LoxsIwriA` |
| 2 | You're reading way too much code | 24:11 | 5,078 | `434cG4g5KLE` |
| 3 | Claude Code's creator has some really good advice | 19:13 | 4,238 | `xmGY276gEFY` |
| 1 | Oh no… | 16:59 | 3,400 | `32iH1WBJbJo` |

43,381 words total. Transcripts were pulled with `yt-dlp` auto-subs and de-rolled with
`vtt2txt.py` (now at `~/yoinks-corpus/bin/`). The transcript files themselves were lost to
a scratchpad wipe; they are reproducible from the IDs above.
