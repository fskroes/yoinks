import {spawn} from 'node:child_process'
import {createWriteStream} from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {parseCaptions} from './captions.js'
import {commandWorks} from './command.js'
import {formatBytes} from './format.js'
import type {Block} from './skippable.js'

const MODEL_DIR = path.join(os.homedir(), '.yoinks', 'models')
const MODEL_NAME = 'ggml-base.bin'
const MODEL_URL = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${MODEL_NAME}`

function run(cmd: string, args: string[], signal?: AbortSignal, onStderrLine?: (line: string) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {signal})
    let stdout = ''
    let stderr = ''
    let buffer = ''
    child.stdout.on('data', chunk => (stdout += chunk))
    child.stderr.on('data', chunk => {
      stderr += chunk
      if (!onStderrLine) return
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) onStderrLine(line)
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr.trim().split('\n').filter(Boolean).at(-1) || `${cmd} exited with code ${code}`))
    })
  })
}

/**
 * Find the whisper.cpp CLI. Unlike yt-dlp there is no standalone binary to
 * fetch per-platform, so a missing install is a hard error with the fix.
 */
export async function findWhisper(): Promise<string> {
  for (const cmd of ['whisper-cli', 'whisper-cpp']) {
    if (await commandWorks(cmd, ['--help'])) return cmd
  }
  throw new Error(
    'Transcribing needs whisper.cpp — install it with “brew install whisper-cpp” and try again.',
  )
}

/**
 * Resolve the whisper model: $YOINKS_WHISPER_MODEL, a previous download,
 * or fetch ggml-base (~142MB) from Hugging Face — same flow as ensureYtDlp.
 */
export async function ensureWhisperModel(onStatus: (message: string) => void, signal?: AbortSignal): Promise<string> {
  const override = process.env['YOINKS_WHISPER_MODEL']
  if (override) {
    await fs.access(override).catch(() => {
      throw new Error(`Whisper model not found at $YOINKS_WHISPER_MODEL (${override}).`)
    })
    return override
  }

  const local = path.join(MODEL_DIR, MODEL_NAME)
  // ~/.cache/whisper is where whisper.cpp docs (and tools like x-transcribe) put models
  for (const candidate of [local, path.join(os.homedir(), '.cache', 'whisper', MODEL_NAME)]) {
    if (await fs.access(candidate).then(() => true, () => false)) return candidate
  }

  await fs.mkdir(MODEL_DIR, {recursive: true})
  const response = await fetch(MODEL_URL, {signal})
  if (!response.ok || !response.body) {
    throw new Error(`Could not download the whisper model (${response.status}). Check your connection and try again.`)
  }

  const total = Number(response.headers.get('content-length'))
  let downloaded = 0
  const progress = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      downloaded += chunk.byteLength
      onStatus(
        `first run: fetching whisper model… ${formatBytes(downloaded)}${total ? ` / ${formatBytes(total)}` : ''}`,
      )
      controller.enqueue(chunk)
    },
  })

  onStatus('first run: fetching whisper model…')
  const tmp = `${local}.download`
  await pipeline(Readable.fromWeb(response.body.pipeThrough(progress) as never), createWriteStream(tmp), {signal})
  await fs.rename(tmp, local)
  return local
}

/**
 * Transcribe a downloaded media file: ffmpeg → 16kHz mono WAV → whisper.cpp.
 * Returns the timed blocks; intermediate files are cleaned up.
 *
 * `-ovtt` rather than the flat text this used to read off stdout. Whisper knows
 * when it heard each segment and writes `00:00:00.000 --> ` cues for them, which
 * is the shape the platform's captions already arrive in — so a source with no
 * captions produces the same timed transcript as one with them, and the same
 * marks. `CONTEXT.md` has defined a transcript as timed since the glossary was
 * written; this is the branch that stopped it being true.
 *
 * Progress still comes off stderr, so `--print-progress` is unaffected by
 * whisper also writing a file.
 */
export async function transcribe(
  opts: {mediaPath: string; ffmpeg?: string; whisper: string; model: string},
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<Block[]> {
  // whisper appends its own extension to -of, so the wav and the vtt share a stem
  const stem = path.join(os.tmpdir(), `yoinks-audio-${process.pid}-${Date.now()}`)
  const wav = `${stem}.wav`
  const vtt = `${stem}.vtt`
  try {
    await run(
      opts.ffmpeg ?? 'ffmpeg',
      ['-y', '-i', opts.mediaPath, '-vn', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav],
      signal,
    )
    await run(
      opts.whisper,
      ['-m', opts.model, '-f', wav, '--no-prints', '--print-progress', '-ovtt', '-of', stem],
      signal,
      line => {
        const percent = /progress\s*=\s*(\d+)%/.exec(line)?.[1]
        // whisper.cpp counts progress in 30s chunks, so short clips can report >100%
        if (percent) onProgress(Math.min(1, Number(percent) / 100))
      },
    )
    return parseWhisperVtt(await fs.readFile(vtt, 'utf8'))
  } finally {
    void fs.rm(wav, {force: true})
    void fs.rm(vtt, {force: true})
  }
}

/**
 * A cue whose whole text is `[Music]`, `(silence)`, `[BLANK_AUDIO]` — what
 * whisper writes where there is no speech.
 */
const NOISE_ONLY = /^[[(][^\])]*[\])]$/

/**
 * Whisper's own VTT, turned into the timed blocks the detector reads.
 *
 * The same `parseCaptions` the platform's captions go through: whisper writes
 * `00:00:00.000 --> ` cues, so once the noise markers are out there is nothing
 * left for a second parser to do. That the one parser serves both rungs is the
 * claim this path rests on — measured in
 * `docs/validation/step-9-whisper-timing.md` and pinned in `captions.test.ts`.
 *
 * Noise cues are removed line by line rather than block by block: a cue left
 * with no text is dropped by `readCues`, which is what keeps `[Music]` from
 * becoming a word in the block around it.
 */
export function parseWhisperVtt(vtt: string): Block[] {
  return parseCaptions(
    vtt
      .split('\n')
      .filter(line => !NOISE_ONLY.test(line.trim()))
      .join('\n'),
  )
}
