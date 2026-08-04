/**
 * The library surface: the source-to-transcript pipeline, without the terminal.
 *
 * `src/cli.tsx` is one caller of this. A script that walks a channel and keeps
 * what it finds is another, and it wants the same guarantees — timed blocks,
 * marked skippable regions, and a fact whose citation is checked rather than
 * trusted (ADR 0005).
 *
 * What is deliberately not here: the Ink components, the click map, the theme,
 * clipboard and history. Those are how a person drives the pipeline, not the
 * pipeline, and exporting them would make the terminal part of the contract.
 *
 * Also not here: any way to save an answer. `CONTEXT.md` defines an answer as
 * shown and thrown away, and a caller that wants one persisted should write it
 * itself rather than have Yoinks grow a second definition of the word.
 */

// Getting the bytes: binaries, probe, captions, download.
export {
  ensureYtDlp,
  findFfmpeg,
  probe,
  fetchCaptions,
  buildChoices,
  download,
  type VideoInfo,
  type ProbeResult,
  type Captions,
  type DownloadChoice,
  type DownloadProgress,
  type DownloadHandlers,
} from './lib/ytdlp.js'

// The second rung: audio recognised locally when a source publishes no captions.
// Timed since `-ovtt`, so it produces the same blocks as the first rung.
export {
  findWhisper,
  ensureWhisperModel,
  transcribe,
  parseWhisperVtt,
} from './lib/transcribe.js'

// VTT — from either rung — into the timed blocks everything downstream reads.
export {parseCaptions} from './lib/captions.js'

// Facts about a source's shape: which spans are not the source.
export {
  detectSkippableRegions,
  type Block,
  type SkipKind,
  type SkippableRegion,
} from './lib/skippable.js'

// The artifact.
export {renderTranscript, stamp} from './lib/transcript.js'

// Asking about a source. `parseFacts` is the invariant, not a formatter: it
// drops any fact whose timestamp is not a block this source has.
export {buildExpansionPrompt, buildFollowUpPrompt, buildPrompt, factStream, parseFacts, type Fact, type ParsedAnswer} from './lib/answer.js'
export {findAssistant, ask, type Assistant, type Turn} from './lib/assistant.js'

// Which platform a url belongs to, and whether it is one at all.
export {detectPlatform, isProbablyUrl, type Platform} from './lib/platforms.js'
