# Answering a question drives an assistant already on the person's PATH

To answer a question about a source, Yoinks shells out to an assistant CLI it finds on the
person's PATH and hands it the transcript and the question. Yoinks does not call a model
itself, holds no API key, and has no billing relationship with anyone.

This is the same pattern the rest of the tool already uses — find yt-dlp, find ffmpeg, find
whisper.cpp, fail with the fix in the error message when one is missing (`findWhisper()` in
`src/lib/transcribe.ts`). It also reproduces exactly the mechanism the product evidence was
generated with: the two useful sessions in `docs/validation/step-2-cold-start.md` were both
answered by an assistant holding the full transcript in context, driven by hand.

## Considered options

- **Bundled API client with a bring-your-own key.** Kills `npx yoinks` zero-config, puts key
  handling and a per-question cost inside an MIT package that strangers install, and buys
  nothing the PATH assistant does not already do.
- **A local model.** whisper.cpp already costs minutes on a long source. Stacking local
  inference over fifteen thousand words makes getting an answer slower than watching at 2x.
- **Handing off — opening a chat application with the transcript preloaded.** The 2026-07-25
  session's preferred answer, and still a reasonable product. Rejected because the answer then
  lives in someone else's window, which contradicts the answer being rendered in Yoinks and
  discarded there.

## Consequences

The audience narrows to people who already have an assistant CLI installed; everyone else gets
a one-line install instruction, as they already do for whisper.cpp. Yoinks is visibly a pipe
rather than a competitor to the chat application — which is the point, and is the cheapest way
to find out whether the shape is worth anything before paying for an API integration. A bundled
client stays available as the upgrade if it is.
