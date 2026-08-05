# ADR 0008 — Recent is a record of what Yoinks did, never of what a source said

**Date:** 2026-08-05
**Status:** Accepted, amended the same day
**Supersedes nothing. Amends `docs/product-thesis.md` Constraint 4.**

> **Amendment, 2026-08-05, by decision of the maintainer.** As first written, this ADR said
> asking a question wrote no row, and the title above said *artifacts*. Both are changed:
> **a source you asked about does get a row**, marked `asked` where an artifact would be, and
> **the question itself is written to a log** for later counting. See
> [ADR 0009](0009-the-ask-log-is-evidence.md) for the log and the argument for it. The line this
> ADR holds is unchanged and is the reason the two are separate files: the panel shows *that* a
> source was asked about; only the log knows *what* was asked, and neither holds a word the
> source said. Consequence 1 below is struck; the rest stands. The original text is kept rather
> than rewritten, because a decision reversed inside an hour is worth being able to read.

## Context

`src/lib/history.ts` has always kept the last fifty source URLs, written on a successful yoink.
It had no visible surface — you reached it only by pressing `↑` in the URL field, which recalled
a URL you could not read the meaning of. The thesis already accounts for this file:

> An earlier draft said "no per-person history", which was overstated and which the shipped code
> already contradicted... That is input convenience — it holds nothing about what a source said
> and feeds no inference. The line to hold is content, not state.
> — `docs/product-thesis.md`, Constraint 4

The proposal was to give that file a surface: a `recent` panel on the home screen, each row
carrying the source's own title so a person reads what they yoinked rather than a URL.

Four layouts were built and looked at (`prototypes/recent-panel/`). That prototype answered
*where the list goes*. It deliberately did not answer *whether the list may exist*, because
Constraint 4 forbids a library and the word for a visible list of past work is a library.

## Decision

**A row records an artifact yoinks produced. It never records what a source said.**

A row holds four strings: the source URL, that source's own title, the artifact's extension, and
when it was saved. That is the same class of information the saved file already carries in
`~/Downloads` — yt-dlp names the file from the title. The panel shows six rows; the file keeps
fifty.

Three consequences follow, and they are the decision, not details of it:

1. ~~**Asking a question writes no row.** `handleAsk` used to call `addToHistory`. It no longer
   does. An answer is shown and thrown away (`CONTEXT.md`), so a source you only asked about
   leaves nothing behind. This is stricter than the code was before this ADR, not looser.~~
   **Struck by the amendment above.** Asking writes a row marked `asked`. A row that already
   names a saved file keeps it — the file you have outranks the question you asked
   (`mergeRow`, `src/lib/history.ts`).
2. **No transcript, no answer, no receipt is ever written to the history file**, and no question
   either: the panel's row says a source was asked about and stops there. What was asked lives
   in the ask log ([ADR 0009](0009-the-ask-log-is-evidence.md)), which nothing on screen reads.
3. **The list is not a workspace.** No tags, no folders, no search, no rename, no per-row
   actions beyond re-yoinking the source. A row is a shortcut back to a URL, and the panel
   appears on the home screen only.

`↑`/`↓` on the home screen move the row cursor, and `↵` re-yoinks the selected source. That
replaces `↑`-recall in the URL field, which is deleted from `src/components/text-input.tsx`
rather than kept alongside — two mechanisms for one job, and the visible one is better.

## Why this does not reopen the corpus

The thesis killed a corpus of past transcripts, and everything that hung off it: the diff for
followed creators, cold-start, second-chance triggers. Every one of those needs to know **what a
source said**. A title and a file extension cannot feed any of them. Nothing in this feature
reads the history file except the panel that draws it, and nothing infers anything from a row.

The honest cost: a title is content in the loose sense — it is the source's words, not yoinks'
observation of them. The defence is that yoinks already writes that exact string to disk as a
filename on every save, so the panel discloses nothing new. If that defence ever stops holding —
if a row starts carrying a description, a topic, a summary line — this ADR is being violated,
not extended.

## Alternatives rejected

- **A rail down the left.** Built and looked at (variant B). At 80 columns it pushes the logo
  off centre, truncates the tagline and takes ~30 columns from the paste box. It also implies a
  persistent surface across every screen, which is the library reading.
- **A strip of chips above the logo** (variant D). A chip holds about 16 characters; real titles
  need 50. Four of six rows read as the same chip.
- **One dim line, `↑` for the rest** (variant C). Honest and cheap, but it answers "where did my
  last file go" rather than "what have I been doing", which is what was asked for.
- **A dedicated `~/Documents/yoinks` folder, or iCloud.** Rejected. Files stay in `~/Downloads`.
  Constraint 4 says no folders, and moving artifacts out of the folder the OS points at buys
  nothing the row does not.

## Consequences

- `src/lib/history.ts` stores records, not strings. A file written by an older version parses to
  nothing and is replaced on the next yoink. No migration, per `AGENTS.md`.
- The home screen grows by eight rows when there is any history, and is unchanged when there is
  none — a first run looks exactly as it did.
- `README.md` gains the panel; the `↑ history` hint becomes `↑↓ recent`.
