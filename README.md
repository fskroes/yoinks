# yoinks

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
  <img src="assets/logo-light.svg" alt="yoinks" width="288">
</picture>

yoink any video. paste. yoink. done.

Download videos from YouTube, X/Twitter, Instagram, Threads, TikTok and
1,800+ other sites — right from your terminal. Paste a url, pick a
resolution (or audio-only mp3), done. No popups, no fake download buttons,
no sketchy redirects.

<img src="assets/home.png" alt="yoinks home screen — paste a link and hit yoink" width="100%">

## Install

```sh
npm install -g yoinks
```

Or try it without installing anything:

```sh
npx yoinks
```

Requires Node 18+. Everything else (yt-dlp, ffmpeg) is fetched or bundled
automatically.

## Usage

```sh
$ yoinks https://youtu.be/dQw4w9WgXcQ    # straight to the format picker
$ yoinks                                 # prompts for a url
$ yoinks --theme light                   # force the light palette
```

yoinks takes over the terminal (full-screen, centered — and restores your
scrollback on exit). Pick a format with ↑/↓ (or j/k, or number keys) and
hit enter. `esc` goes back, `^c` quits. Or just use the mouse — the yoink
button, the format list and the footer hints are all clickable, and
clicking the logo takes you back home. Files are saved to `~/Downloads`,
and the file path is printed to your terminal when you're done.

Under the paste box, `recent` shows the last six sources you did something
with — the source's own title, which file came out (or `asked`, where you
got an answer and no file), and how long ago. `↑`/`↓` picks one and `↵`
yoinks it again; `esc` gives the paste box back.

Two files, both local, both yours to delete:

- `~/.config/yoinks/history.json` — the last fifty rows, which is what the
  panel draws. No question and nothing a source said.
- `~/.config/yoinks/asks.jsonl` — one line per question you ask, with how
  many places in the source backed the answer and how many timestamps the
  gate dropped. yoinks never reads it back and never shows it; it is there so
  you can count your own questions later (`jq` is enough). It holds no
  transcript, no answer and no quote.

The default `auto` theme uses your terminal's own foreground and background,
so it follows light and dark terminal themes without guessing. Press `^t` or
click the theme control in the footer to cycle through `auto`, `light`, and
`dark` for the current session. Use `--theme auto`, `--theme light`, or
`--theme dark` to choose the starting theme for one launch.

<img src="assets/download-options.png" alt="yoinks format picker — resolutions with estimated file sizes, plus audio-only mp3" width="100%">

## Ask about a source

On the pick screen, just start typing to ask a question instead of saving the file.

```sh
$ yoinks https://x.com/user/status/1234567890
> what did they say the pricing was?
```

You get a short answer in plain prose, and under it a line saying how many places in the
source back it. Hit enter to unfold them: timestamped lines in the source's own words, each
one a place you can go and check. Pick one to ask for more about that moment.

The part that matters is what you never see. Assistants invent citations, and a timestamp is
the easiest thing to invent because it looks like evidence. So yoinks checks every timestamp
against the transcript it actually has, drops the ones that don't resolve, and if nothing
survives it tells you the source doesn't answer that rather than showing you a confident
paragraph with nothing behind it.

If you can paste your link into a chatbot, do that — it's faster and it can see the picture
as well as hear the words. yoinks is for the other links: the private one, the unlisted one,
the one on a site no chatbot accepts, the one you'd rather not upload. It reads what is said,
not what is shown, and nothing but the question and the transcript leaves your machine.

## How it works

- Powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp). On first run,
  yoinks downloads the standalone yt-dlp binary to `~/.yoinks/bin` —
  no Python required. If you already have yt-dlp installed, it uses yours.
- ffmpeg (needed for merging high-res streams and mp3 extraction) is found
  on your PATH, with `ffmpeg-static` as a bundled fallback.
- The `transcript · txt` option saves a `.txt` to `~/Downloads`. Where the
  platform publishes its own English captions it uses those, which is fast and
  needs nothing installed: every line carries the time it was said, and sponsor
  reads, subscribe interruptions and creator outros are marked with the phrase
  that gave each one away, so you can check it against the source.
- Where a source has no captions, it falls back to downloading the audio and
  transcribing it locally with
  [whisper.cpp](https://github.com/ggerganov/whisper.cpp)
  (`brew install whisper-cpp`) — the audio itself is discarded. On first use
  the ggml-base model (~142MB) is downloaded to `~/.yoinks/models`, unless one
  already exists in `~/.cache/whisper` or `$YOINKS_WHISPER_MODEL` points at
  another model. That path is not timed, so nothing is marked in it.
- Asking a question hands the transcript, with your question, to an assistant
  already on your PATH (Claude Code or Codex). yoinks never calls a model
  itself and holds no API key, so there's nothing to sign up for and no usage
  to pay for twice. Answers are shown and thrown away — yoinks saves nothing.
  Follow-up questions continue a conversation your assistant remembers, the
  same way any chat with it does.
- The UI is [Ink](https://github.com/vadimdemedes/ink) — React for the
  terminal.

## Development

```sh
npm install
npm run build        # bundle to dist/ with tsup
npm run dev          # rebuild on change
node dist/cli.js <url>
npm run typecheck
```

To try it as a global command without publishing: `npm link`, then run
`yoinks` anywhere.

## Roadmap

- [ ] `--best` / `--mp3` flags to skip the picker (scriptable mode)
- [ ] `-o <dir>` to choose the output folder
- [ ] Playlist / thread-with-multiple-videos support
- [ ] Clipboard detection: launch bare and auto-suggest the url you copied
- [ ] Self-update for the bundled yt-dlp binary (`yt-dlp -U`)
- [x] Publish to npm (`npm i -g yoinks` / `npx yoinks`)
- [ ] `curl yoinks.sh | sh` installer

## A note on fair use

yoinks is a personal-archiving tool. Downloading content may violate a
platform's terms of service — only download what you have the right to
keep, and be excellent to creators.

## License

[MIT](LICENSE)
