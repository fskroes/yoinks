# PROTOTYPE — what should "recent yoinks" look like on the home screen?

Throwaway. Not imported by `src/`; it imports `src/` rather than the other way round.

## The question

`src/lib/history.ts` already keeps the last fifty source URLs, written on a **successful yoink**
(`src/app.tsx:449`, `:612`). It has no visible surface — you reach it only with `↑` in the URL
field. The proposal is to give it one, and to carry the source's title on the row so a person can
read what they yoinked rather than a URL.

This prototype does not ask whether to build it. It asks:

> **Where does the list go, and how much of the home screen may it take?**

The home screen today is one centred column: logo, tagline, paste box, hints. Every layout below
takes something from that. The prototype exists so the cost is looked at rather than imagined.

## Not the question, and out of scope here

- **Whether a list is allowed at all.** `docs/product-thesis.md` Constraint 4 says nothing
  accumulates about the content, and names *questions asked* as the line. Rows here hold a URL,
  the source's own title, which artifact came out, and when. No transcript, no question, no
  answer. That is a decision for an ADR, not for a layout.
- **`-o <dir>` and where files land.** Unrelated to the shape of the panel.

## Run it

```
npm run prototype:recent-panel
npm run prototype:recent-panel -- --variant B     # open on one; ←/→ still reach the rest
npm run prototype:recent-panel -- --theme dark    # auto | light | dark
```

`←`/`→` switch variant, `↑`/`↓` move the row cursor, `t` cycles the theme, `q` quits. The bar at
the bottom is the switcher; it is inverse-video on purpose, so it cannot be mistaken for part of
the design being judged.

Six fake rows, held in memory. Nothing is read from `~/.config/yoinks/history.json` and nothing is
written anywhere. No yt-dlp, no network, no assistant on PATH.

The rows are deliberately awkward — one title far longer than any layout here can hold, one X post
with no title at all, all three artifacts, and a spread of ages. A prototype fed tidy data lies.

## The four variants

| | Shape | What it costs |
|---|---|---|
| **A** | A `recent` panel under the paste box | 8 rows of vertical space on the home screen |
| **B** | A rail down the left | The screen stops being centred; the paste box gives up ~30 columns |
| **C** | One dim line under the paste box, `↑` for the rest | Shows one row, not a list |
| **D** | A strip of chips above the logo | Chips need short labels; real titles are long |

Each variant renders the whole screen, so any of them may throw out the layout. They share the
logo, the paste box and the hint line only because those are the real ones from `src/components/`.

## What to look at

1. **Does the home screen still read as "paste a link"?** The paste box is the primary
   affordance. A list that outweighs it turns the home screen into a library, which is the reading
   Constraint 4 refuses.
2. **B at 80 columns.** The rail fits, but the logo sits off centre, the tagline truncates and the
   input loses half its width. Judge that against a wide terminal, not only yours.
3. **The long title.** A 72-character title truncates in every variant. Read whether the truncated
   form is still recognisable a week later — that is the whole value of carrying a title.
4. **The X row.** It has no title. Every layout falls back to the URL, and the fallback is the
   common case on X, Instagram and Threads.
5. **Whether the time column earns its columns in A**, or whether `mp4 · yesterday` is noise that
   costs title characters.

## Result — 2026-08-05: A, the list under the input

**Variant A wins and is shipped.** It keeps the paste box the largest thing on the screen, holds
six rows without argument, and costs only vertical space on the one screen where the list has a
job.

The three that lost, and why:

- **B, the rail.** Renders whole at 80 columns, and takes the logo off centre, the tagline's last
  words and half the paste box to do it. It also implies a surface on every screen, which is the
  library reading Constraint 4 refuses.
- **D, the chips.** A chip holds ~16 characters and a real title needs 50. Four of the six rows
  read as the same chip. Failed on the data, not on taste.
- **C, the one line.** Honest and the cheapest of the four, but it answers "where did my last file
  go" rather than "what have I been doing".

What the awkward rows caught, and what shipped because of them:

- The long title truncates in every variant, so the shipped row truncates through
  `recentTitle()` — one function, used by both the render and the click hit-test, because a title
  cut one way and matched another is a dead click target (`src/components/recent.test.ts`).
- The X row has no title. The shipped code falls back to the URL (`info?.title || url`).
- The time column earns its columns and stayed: `mp4 · 2h`.

The decision the prototype refused to take is taken in
[ADR 0008](../../docs/adr/0008-recent-is-artifacts-not-content.md).

## Status

**Answered, and the code is still here — 2026-08-05.** `run.tsx` and
`npm run prototype:recent-panel` stay until the change they cleared is released, the way
`prototypes/whisper-timing` did. Delete them then, keep this file as the record, and let git hold
the four variants.
