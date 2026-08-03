# Step 8 — how much coverage is one yt-dlp flag worth?

Run 2026-08-03, while shipping the second caption pass in `fetchCaptions`.

`fetchCaptions` asked yt-dlp for `--write-auto-subs` only, so it saw machine-generated captions
and nothing else. A source captioned by a human therefore looked captionless: it fell through to
whisper, and because whisper is untimed it got no skip marks and **could not be asked about at
all** — `handleAsk` refuses a source with no timed blocks rather than cite times it does not
have.

The question this step answers is not "does the flag work". It is whether the coverage it buys
is real, and whether buying it moves anything that already worked.

## The corpus is the maintainer's own history, and it is n=17

`~/.config/yoinks/history.json` — every source actually yoinked, 17 of them. This is the right
corpus for a project that says plainly it is built on n=1, and it is **not a claim about the
world**: it is 12 YouTube, 4 X, and one of everything else. A wider sample could reorder the
priorities that follow from it.

## Verdict: 12 of 17 → 15 of 17, with nothing that worked before moving

Both passes were run independently against all 17 sources, so one run yields the before and the
after and shows which pass each source answered on.

| | Before (machine-generated only) | After (machine-generated → human-authored) |
|---|---|---|
| Sources with usable captions | 12 of 17 | **15 of 17** |
| Regressions | — | **0** |

The three that moved are all X, and all three had perfectly good English captions in
`subtitles.en` that Yoinks never asked for:

| Source | Pass | Blocks | Words |
|---|---|---|---|
| `x.com/21xSilverhand/…2083717655366635540` | **human-authored (new)** | 27 | 2,825 |
| `x.com/hot_town/…2080638278785458315` | **human-authored (new)** | 8 | 1,214 |
| `x.com/BITCOINFUNDMGR/…2082949014937641375` | **human-authored (new)** | 3 | 335 |

The two still failing have no caption track of either kind: `1La4QzGeaaQ` (Peru 8K — scenery, no
speech) and `x.com/iamgrantowen/…2083761958788927691`. Only whisper timestamps would reach them,
which is what remains open on issue #5 — and one of the two is a silent scenery video where
whisper produces `(soft music)` on repeat. That is the measured case for doing this first and
that second: **three useful sources against roughly one.**

## Why two passes rather than one command carrying both flags

Where a source has both kinds of track, yt-dlp prefers the human-authored one. A single combined
invocation would therefore silently change which captions every such source gets, and every
number in [step 6](step-6-caption-path.md) was measured on the machine-generated ones.

Two passes in order makes that impossible by construction: pass one is the invocation that
shipped at `1b7f6ad`, byte for byte, so a source that answers on it is not merely unlikely to
change — it cannot. The second yt-dlp call is paid for only by sources that fetch nothing at all
today. The zero in the regression row above is what that guarantee looks like measured.

A second reason it holds here, from `--list-subs` across all 17 — and the handoff into this step
had the count wrong, so it is written out. **Three** YouTube sources carry a human-authored track
alongside their machine-generated ones, not one:

| Source | Human-authored track | Selected by `--sub-lang en`? |
|---|---|---|
| `Qh7Oxvo5sJI` | `en-US` | no |
| `LRGX-gTegVA` | `en-US` | no |
| `HA7lZd7zk3M` | `en-j3PyPqV-e1s` | no |

`--sub-lang en` matches exactly, so none of the three is selectable — and all three answer on
pass one anyway, so pass two never runs for them. The substance the handoff claimed survives its
arithmetic being off: no source in this corpus can have its captions changed by this, for two
independent reasons.

The three X sources that moved are the only ones in the corpus with a human-authored track named
exactly `en`.

`--sub-lang` stays `en` on both passes. Widening only the second pass would cost nothing on the
validated path, but the table above is the reason it would also *buy* nothing here: the only
non-`en` human-authored tracks belong to sources that already pass. Nothing in this corpus needs
it and nothing would test it.

## Both branches were driven through the actual CLI

Scores above come from a scratch script calling the same functions, which leaves the wiring in
`src/app.tsx` unexercised. So `node dist/cli.js` was driven in a pty against
`x.com/21xSilverhand/…`, a source that before this change reached whisper:

| Branch | Result |
|---|---|
| `transcript · txt` | `Silverhand - A man who went to prison….txt` — 56 lines, 2,869 words, `[m:ss]` throughout, no skip marks |
| ask a question | four facts, each carrying a timestamp that resolves to a block that says it |

No skip marks is correct, not a miss: `detectSkippableRegions` returns `[]` on this source, and
it is a 22-minute interview with no sponsor read in it. Declining to mark is the behaviour ADR
0001 asks for.

The question asked was *"What does the guest say keeps him awake at night?"*, and the answer
cited `[0:49] "China is really unknown to us And That does keep me awake at night"`. Before this
change the same source answered `This source has no captions, so there is nothing an answer
could point at.`

## Three findings about human-authored captions worth keeping

**1. The rolling-overlap strip is very nearly a no-op on them, but not entirely.**
`stripRollingOverlap` exists because machine-generated captions reprint the previous cue. Human
ones do not roll, so on them it mostly does nothing — except that it drops the longest match
between the previous cue's tail and this cue's head, so a phrase genuinely repeated across a cue
boundary loses a copy.

What saves it in practice is that human captions have real punctuation and capitalisation, and
the match is word-for-word: `is,` is not `is`, and `No,` is not `no`. It takes a bare
unpunctuated repeat — `"it was very very"` + `"very good"` — to lose anything, and then it loses
exactly one word. It did not visibly corrupt the 2,825-word sample.

This is now pinned in `captions.test.ts` from both sides: one test asserts a repeat with
punctuation survives, one records that a bare one does not. The strip is deliberately **not**
changed — the parser cannot tell which kind of track it is reading, and the strip is what every
number in this directory was measured through.

All three new tests passed when written, so all three were falsified, per the repo rule:

| Falsification | Turns red |
|---|---|
| Match case- and punctuation-insensitively (a plausible "improvement") | the repeat-survives test — **and no pre-existing test in the file** |
| Narrow `TAG` to YouTube's `<c>` spans only | the X-tag test, the repeat-survives test, and two pre-existing |
| Drop `stripRollingOverlap` from `parseCaptions` | the bare-repeat test, and two pre-existing |

The first row is the reason that test is worth having: the failure mode it guards had no other
guard.

**2. X's captions capitalise oddly.** `"To fill The demand You have to grow or produce certain
amount Of crop Or milk"` is verbatim from the artifact. It reads as though capitalisation follows
cue-internal word timing rather than sentence structure. It costs nothing here — the detector
lowercases before matching, and a person reading the transcript is unbothered — but anyone
comparing detector behaviour across the two kinds of track should know the text is not as clean
as "human-authored" suggests.

**3. The single-block `0:00–0:00` case does not occur in this corpus.** The handoff flagged it as
cosmetic but likely: a clip short enough to parse to one block makes `medianSpacing` return `0`
(`skippable.ts:124`, `if (!gaps.length) return 0`), so a region's `end` equals its `start` and
`renderTranscript` would print `0:00–0:00`. X clips are short, and the three new sources are the
shortest in the corpus — so they are exactly where it would show.

Measured: the smallest is `BITCOINFUNDMGR` at **3 blocks**, and no source in the corpus parses to
one. Reaching it needs a clip under ~45 seconds *and* a skippable region detected inside it. It
is left unfixed and recorded rather than guessed at.

## What this is not

It is not a test. It needs the network, YouTube and X, so it cannot live in `npm test`. It does
not re-measure the 6/6 — pass one is unchanged, so step 6's numbers stand untouched by
construction rather than by re-measurement. And it says nothing about whether the marks or the
answers are worth having; `docs/product-thesis.md` still rests that on the maintainer's own use,
and the maintainer has now shipped two features since last using the product.
