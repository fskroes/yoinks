import React, {useCallback, useEffect, useRef, useState} from 'react'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {Box, Text, useApp, useInput, useStdout} from 'ink'
import SelectInput, {type IndicatorProps, type ItemProps} from 'ink-select-input'
import Spinner from 'ink-spinner'
import {FramedInput} from './components/framed-input.js'
import {FullScreen} from './components/fullscreen.js'
import {Logo} from './components/logo.js'
import {Panel} from './components/panel.js'
import {ProgressBar} from './components/progress-bar.js'
import {Shortcuts} from './components/shortcuts.js'
import {TextInput} from './components/text-input.js'
import {clickTargetAt, findFrameRow, frameRowSpan, type ClickTarget} from './lib/click-map.js'
import {formatBytes, formatDuration, formatEta, formatSpeed, shortenPath, truncate, wrapText} from './lib/format.js'
import {addToHistory, loadHistory} from './lib/history.js'
import {detectPlatform, isProbablyUrl, type Platform} from './lib/platforms.js'
import {useMouseClick} from './lib/use-mouse-click.js'
import {nextThemeMode, ThemeProvider, type ThemeMode, useTheme} from './theme.js'
import {
  buildChoices,
  download,
  ensureYtDlp,
  fetchCaptions,
  findFfmpeg,
  probe,
  type DownloadChoice,
  type DownloadProgress,
  type VideoInfo,
} from './lib/ytdlp.js'
import {parseCaptions} from './lib/captions.js'
import {detectSkippableRegions, type Block} from './lib/skippable.js'
import {renderTranscript, stamp} from './lib/transcript.js'
import {ensureWhisperModel, findWhisper, transcribe} from './lib/transcribe.js'
import {buildPrompt, parseFacts, type Fact} from './lib/answer.js'
import {ask, findAssistant} from './lib/assistant.js'

const OUT_DIR = path.join(os.homedir(), 'Downloads')
const YOINK_BUTTON = 'yoink'
const DONE_LABEL = '↵ yoink another'
const TAGLINE = 'yoink any video. paste. yoink. done.'

const AUDIO_GLYPH = '♪ '
const TRANSCRIPT_GLYPH = '✎ '
const VIDEO_GLYPH = '▶ '

const choiceLabel = (choice: DownloadChoice) =>
  `${choice.kind === 'audio' ? AUDIO_GLYPH : choice.kind === 'transcript' ? TRANSCRIPT_GLYPH : VIDEO_GLYPH}${choice.label}`

function ChoiceIndicator({isSelected}: IndicatorProps) {
  const theme = useTheme()
  return (
    <Box marginRight={1}>
      <Text color={theme.primary}>{isSelected ? '❯' : ' '}</Text>
    </Box>
  )
}

// SelectInput spreads the whole item onto its item component, so we can carry
// a `rule` flag through to draw the video/artifact divider.
function ChoiceItem({isSelected, label, rule}: ItemProps & {rule?: boolean}) {
  const theme = useTheme()
  const item = (
    <Text color={theme.primary} bold={isSelected}>
      {label}
    </Text>
  )
  if (!rule) return item
  // subtle rule below the last video artifact, so audio and transcript read as
  // peer artifacts rather than more video resolutions
  return (
    <Box flexDirection="column">
      {item}
      <Text color={theme.gray} dimColor={theme.dimSecondary}>{'┈'.repeat(28)}</Text>
    </Box>
  )
}

// explicit blank lines — empty <Box height={1}/> spacers can collapse, and
// ink boxes default to flexShrink=1, so spacers are the first thing yoga
// crushes when content overflows the terminal
const Gap = ({lines = 1}: {lines?: number}) => (
  <Box flexDirection="column" flexShrink={0}>
    {Array.from({length: lines}, (_, i) => (
      <Text key={i}> </Text>
    ))}
  </Box>
)

// fixed-width slots — the centered line must not change width as values tick,
// otherwise the whole layout shifts on every progress update
function partLabel(progress: DownloadProgress): string {
  // explains the bar resetting between files (video, then audio)
  return progress.totalParts > 1 ? `part ${progress.part + 1}/${progress.totalParts}  ` : ''
}

function downloadMeta(progress: DownloadProgress): string {
  const speed = progress.speed ? formatSpeed(progress.speed) : ''
  const eta = progress.eta ? `${formatEta(progress.eta)} left` : ''
  return `${partLabel(progress)}${speed.padStart(10)}  ${eta.padEnd(12)}`
}

function indeterminateMeta(progress: DownloadProgress): string {
  const bytes = formatBytes(progress.downloadedBytes)
  const speed = progress.speed ? formatSpeed(progress.speed) : ''
  return `${partLabel(progress)}${bytes.padStart(8)}  ${speed.padEnd(10)}`
}

/**
 * Recognise a source's audio into timed blocks: fetch the audio to a temp
 * directory, hand it to whisper, throw the audio away.
 *
 * What comes back is the same shape the platform's captions parse to, so a
 * caller cannot tell which rung ran except by how long it took — measured in
 * `docs/validation/step-9-whisper-timing.md`. Only the answer path uses this;
 * the picker drives its own download because that one carries the chosen
 * format, the part counter and the expired-URL retry.
 */
async function recognise(
  opts: {ytdlp: string; url: string; choice: DownloadChoice},
  on: {onStatus: (status: string) => void; onPercent: (percent: number) => void},
  signal: AbortSignal,
): Promise<Block[]> {
  // fail fast on a missing whisper install, before downloading anything
  const whisper = await findWhisper()
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yoinks-transcribe-'))
  try {
    const ffmpegLocation = await findFfmpeg()
    const mediaPath = await download(
      {ytdlp: opts.ytdlp, ffmpegLocation, url: opts.url, choice: opts.choice, outDir: tmpDir},
      {
        onProgress: progress =>
          on.onStatus(
            `fetching the audio… ${formatBytes(progress.downloadedBytes)}${
              progress.totalBytes ? ` / ${formatBytes(progress.totalBytes)}` : ''
            }`,
          ),
        onProcessing: () => on.onStatus('fetching the audio…'),
      },
      signal,
    )
    const model = await ensureWhisperModel(on.onStatus, signal)
    if (signal.aborted) throw new Error('Cancelled.')
    on.onStatus('recognising the audio…')
    return await transcribe({mediaPath, ffmpeg: ffmpegLocation, whisper, model}, on.onPercent, signal)
  } finally {
    void fs.rm(tmpDir, {recursive: true, force: true})
  }
}

export type Outcome = {filepath?: string}

type Phase =
  | {name: 'input'; warning?: string}
  | {name: 'probing'; status: string}
  | {name: 'picking'}
  | {
      name: 'downloading'
      choice: DownloadChoice
      progress?: DownloadProgress
      processing: boolean
      refreshing?: boolean
    }
  | {name: 'transcribing'; status: string; percent?: number}
  | {name: 'answering'; status: string}
  | {name: 'answered'; question: string; facts: Fact[]}
  | {name: 'done'; filepath: string}
  | {name: 'error'; message: string}

const HINTS: Record<Phase['name'], Array<[string, string]>> = {
  input: [
    ['↵', 'yoink'],
    ['^c', 'quit'],
  ],
  probing: [
    ['esc', 'cancel'],
    ['^c', 'quit'],
  ],
  picking: [
    ['↑↓', 'choose'],
    ['↵', 'yoink'],
    ['esc', 'back'],
    ['^c', 'quit'],
  ],
  downloading: [
    ['esc', 'cancel'],
    ['^c', 'quit'],
  ],
  transcribing: [
    ['esc', 'cancel'],
    ['^c', 'quit'],
  ],
  answering: [
    ['esc', 'cancel'],
    ['^c', 'quit'],
  ],
  answered: [
    ['↵', 'back'],
    ['^c', 'quit'],
  ],
  done: [['^c', 'quit']],
  error: [
    ['↵', 'try again'],
    ['^c', 'quit'],
  ],
}

type AppProps = {
  initialUrl?: string
  clipboardUrl?: string
  initialThemeMode?: ThemeMode
  onOutcome: (outcome: Outcome) => void
}

export function App({initialThemeMode = 'auto', ...props}: AppProps) {
  const [themeMode, setThemeMode] = useState(initialThemeMode)
  const cycleTheme = useCallback(() => {
    setThemeMode(nextThemeMode)
  }, [])

  return (
    <ThemeProvider mode={themeMode}>
      <AppContent {...props} cycleTheme={cycleTheme} />
    </ThemeProvider>
  )
}

function AppContent({
  initialUrl,
  clipboardUrl,
  onOutcome,
  cycleTheme,
}: {
  initialUrl?: string
  clipboardUrl?: string
  onOutcome: (outcome: Outcome) => void
  cycleTheme: () => void
}) {
  const theme = useTheme()
  const {exit} = useApp()
  const {stdout} = useStdout()
  const [url, setUrl] = useState(initialUrl ?? '')
  const [urlInput, setUrlInput] = useState('')
  const [history, setHistory] = useState(loadHistory)
  const [platform, setPlatform] = useState<Platform>()
  const [info, setInfo] = useState<VideoInfo>()
  const [choices, setChoices] = useState<DownloadChoice[]>([])
  // the ask input on the picking screen: closed until the person starts typing
  const [asking, setAsking] = useState(false)
  const [question, setQuestion] = useState('')
  const ytdlpRef = useRef('')
  const highlightRef = useRef(0) // choice under the cursor, for the ↵ hint click
  const infoJsonRef = useRef<string | undefined>(undefined)
  const abortRef = useRef<AbortController | undefined>(undefined)
  const [phase, setPhase] = useState<Phase>(initialUrl ? {name: 'probing', status: 'warming up…'} : {name: 'input'})

  const columns = stdout?.columns && stdout.columns > 0 ? stdout.columns : 80
  const boxWidth = Math.max(14, Math.min(64, columns - 6))
  const contentWidth = Math.max(10, Math.min(columns - 4, 78))

  const startProbe = useCallback(async (targetUrl: string) => {
    const controller = new AbortController()
    abortRef.current = controller
    setPlatform(detectPlatform(targetUrl))
    setPhase({name: 'probing', status: 'warming up…'})
    try {
      const ytdlp =
        ytdlpRef.current ||
        (await ensureYtDlp(status => setPhase({name: 'probing', status}), controller.signal))
      ytdlpRef.current = ytdlp
      if (controller.signal.aborted) return
      setPhase({name: 'probing', status: 'fetching video info…'})
      const {info: videoInfo, infoJsonPath} = await probe(ytdlp, targetUrl, controller.signal)
      if (controller.signal.aborted) return
      infoJsonRef.current = infoJsonPath
      setInfo(videoInfo)
      setChoices(buildChoices(videoInfo))
      highlightRef.current = 0
      setPhase({name: 'picking'})
    } catch (error) {
      if (controller.signal.aborted) return
      setPhase({name: 'error', message: error instanceof Error ? error.message : String(error)})
    }
  }, [])

  useEffect(() => {
    if (initialUrl) void startProbe(initialUrl)
  }, [initialUrl, startProbe])

  const resetToInput = useCallback(() => {
    setUrl('')
    setUrlInput('')
    setPlatform(undefined)
    setInfo(undefined)
    setChoices([])
    setAsking(false)
    setQuestion('')
    setPhase({name: 'input'})
  }, [])

  // An answer is shown and thrown away — it is never saved and never an
  // artifact (CONTEXT.md), so leaving it goes back to the source you asked
  // about rather than all the way home.
  const backToPicking = useCallback(() => {
    setAsking(false)
    setQuestion('')
    setPhase({name: 'picking'})
  }, [])

  const cancelRun = useCallback(() => {
    abortRef.current?.abort()
    resetToInput()
    setUrlInput(url) // keep the link around so a cancel isn't destructive
  }, [resetToInput, url])

  useInput(
    (input, key) => {
      if (key.ctrl && input === 't') {
        cycleTheme()
        return
      }
      // while the ask input is open it owns the keyboard; esc closes it and
      // hands the picker back rather than abandoning the source
      if (phase.name === 'picking' && asking) {
        if (key.escape) {
          setAsking(false)
          setQuestion('')
        }
        return
      }
      // start typing on the picking screen and you are asking about the source
      if (
        phase.name === 'picking' &&
        input &&
        !key.ctrl &&
        !key.meta &&
        !key.escape &&
        !key.return &&
        !key.tab &&
        !key.upArrow &&
        !key.downArrow
      ) {
        setQuestion(input)
        setAsking(true)
        return
      }
      if (key.escape && (phase.name === 'picking' || phase.name === 'error' || phase.name === 'done')) resetToInput()
      if (key.escape && (phase.name === 'probing' || phase.name === 'downloading' || phase.name === 'transcribing'))
        cancelRun()
      if (key.escape && phase.name === 'answering') cancelRun()
      if (key.escape && phase.name === 'answered') backToPicking()
      if (key.return && phase.name === 'answered') backToPicking()
      if (key.return && (phase.name === 'error' || phase.name === 'done')) resetToInput()
    },
    {isActive: Boolean(process.stdin.isTTY)},
  )

  const handleUrlSubmit = (value: string) => {
    const trimmed = value.trim()
    if (!isProbablyUrl(trimmed)) {
      setPhase({name: 'input', warning: 'that doesn’t look like a link — paste a full url'})
      return
    }
    setUrl(trimmed)
    void startProbe(trimmed)
  }

  const clipboardOffered = Boolean(clipboardUrl) && urlInput === ''
  const clipboardAccepted = Boolean(clipboardUrl) && urlInput === clipboardUrl

  const handlePick = (item: {value: number}) => {
    const choice = choices[item.value]
    const controller = new AbortController()
    abortRef.current = controller
    const transcript = choice.kind === 'transcript'
    setPhase(
      transcript
        ? {name: 'transcribing', status: 'looking for captions…'}
        : {name: 'downloading', choice, processing: false},
    )
    void (async () => {
      const handlers = {
        onProgress: (progress: DownloadProgress) =>
          setPhase(prev => (prev.name === 'downloading' ? {...prev, progress, processing: false} : prev)),
        onProcessing: () =>
          setPhase(prev => (prev.name === 'downloading' ? {...prev, processing: true} : prev)),
      }
      const finish = (filepath: string) => {
        onOutcome({filepath})
        setHistory(addToHistory(url))
        setPhase({name: 'done', filepath})
      }
      // Where both rungs meet. The platform's captions and whisper's own VTT
      // parse to the same timed blocks, so there is one artifact rather than a
      // marked one and a flat one (ADR 0004).
      const writeTranscript = async (name: string, blocks: Block[]) => {
        const filepath = path.join(OUT_DIR, name)
        await fs.mkdir(OUT_DIR, {recursive: true})
        await fs.writeFile(
          filepath,
          renderTranscript({title: info?.title, url, blocks, regions: detectSkippableRegions(blocks)}),
        )
        return filepath
      }
      // the whisper fallback downloads audio to a temp dir — only the .txt lands in Downloads
      let tmpDir: string | undefined
      try {
        if (transcript) {
          // The platform's captions are already timed, so this path downloads
          // nothing and recognises nothing — and being timed is what lets the
          // interruptions be marked at all (CONTEXT.md, Transcript).
          const captions = await fetchCaptions({ytdlp: ytdlpRef.current, url}, controller.signal)
          const blocks = captions ? parseCaptions(captions.vtt) : []
          if (captions && blocks.length) {
            finish(await writeTranscript(`${captions.name}.txt`, blocks))
            return
          }
          // No captions. Fall back to recognising the audio, which whisper also
          // returns timed — so this branch produces the same artifact, marks and
          // all, and differs only in how long it takes.
          setPhase({name: 'downloading', choice, processing: false})
        }
        // fail fast on a missing whisper install, before downloading anything
        const whisper = transcript ? await findWhisper() : undefined
        if (transcript) tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yoinks-transcribe-'))
        const ffmpegLocation = await findFfmpeg()
        const base = {ytdlp: ytdlpRef.current, ffmpegLocation, url, choice, outDir: tmpDir ?? OUT_DIR}
        let filepath: string
        try {
          // reuse the probe's metadata — starts immediately instead of re-extracting
          filepath = await download({...base, infoJsonPath: infoJsonRef.current}, handlers, controller.signal)
        } catch (error) {
          if (controller.signal.aborted) throw error
          // media urls in the cached info can expire — retry with a fresh extraction
          setPhase(prev =>
            prev.name === 'downloading' ? {...prev, progress: undefined, refreshing: true} : prev,
          )
          filepath = await download(base, handlers, controller.signal)
        }
        if (whisper) {
          const model = await ensureWhisperModel(
            status => setPhase({name: 'transcribing', status}),
            controller.signal,
          )
          if (controller.signal.aborted) return
          setPhase({name: 'transcribing', status: 'transcribing…', percent: 0})
          const blocks = await transcribe(
            {mediaPath: filepath, ffmpeg: ffmpegLocation, whisper, model},
            percent => setPhase(prev => (prev.name === 'transcribing' ? {...prev, percent} : prev)),
            controller.signal,
          )
          if (!blocks.length) throw new Error('No speech found in this video.')
          filepath = await writeTranscript(`${path.parse(filepath).name}.txt`, blocks)
        }
        finish(filepath)
      } catch (error) {
        if (controller.signal.aborted) return
        setPhase({name: 'error', message: error instanceof Error ? error.message : String(error)})
      } finally {
        if (tmpDir) void fs.rm(tmpDir, {recursive: true, force: true})
      }
    })()
  }

  const handleAsk = (asked: string) => {
    const trimmed = asked.trim()
    if (!trimmed) return
    setAsking(false)
    const controller = new AbortController()
    abortRef.current = controller
    setPhase({name: 'answering', status: 'looking for an assistant…'})
    void (async () => {
      try {
        // fail fast on a missing assistant, before fetching anything (ADR 0002)
        const assistant = await findAssistant()
        if (controller.signal.aborted) return
        setPhase({name: 'answering', status: 'reading the captions…'})
        const captions = await fetchCaptions({ytdlp: ytdlpRef.current, url}, controller.signal)
        let blocks = captions ? parseCaptions(captions.vtt) : []
        if (!blocks.length) {
          // No captions. Whisper's own VTT is timed too, so a fact can still
          // point back at the source (ADR 0001) — it just costs a download and
          // a few minutes rather than a few seconds.
          const choice = choices.find(item => item.kind === 'transcript')
          if (!choice) throw new Error('This source has no audio to recognise.')
          setPhase({name: 'transcribing', status: 'no captions — recognising the audio instead…'})
          blocks = await recognise(
            {ytdlp: ytdlpRef.current, url, choice},
            {
              onStatus: status => setPhase({name: 'transcribing', status}),
              onPercent: percent =>
                setPhase(prev => (prev.name === 'transcribing' ? {...prev, percent} : prev)),
            },
            controller.signal,
          )
          if (controller.signal.aborted) return
          if (!blocks.length) throw new Error('No speech found in this video.')
        }
        setPhase({name: 'answering', status: `asking ${assistant.name}…`})
        const raw = await ask(
          assistant,
          buildPrompt({
            title: info?.title,
            url,
            blocks,
            regions: detectSkippableRegions(blocks),
            question: trimmed,
          }),
          controller.signal,
        )
        if (controller.signal.aborted) return
        setHistory(addToHistory(url))
        setPhase({name: 'answered', question: trimmed, facts: parseFacts(raw, blocks).facts})
      } catch (error) {
        if (controller.signal.aborted) return
        setPhase({name: 'error', message: error instanceof Error ? error.message : String(error)})
      }
    })()
  }

  let hints: Array<[string, string]> = [...HINTS[phase.name], ['^t', `theme:${theme.mode}`]]
  if (phase.name === 'input' && history.length > 0) {
    hints = [hints[0]!, ['↑', 'history'], ...hints.slice(1)]
  }
  if (phase.name === 'picking' && asking) {
    hints = [['↵', 'ask'], ['esc', 'back to saving'], ['^c', 'quit'], ['^t', `theme:${theme.mode}`]]
  }

  // Anything a mouse user would expect to press is clickable. Targets are
  // found by their text in the rendered frame (see lib/click-map.ts), so
  // there is no layout math to keep in sync.
  const hintAction = (key: string): (() => void) | undefined => {
    if (key === '^c') return () => exit()
    if (key === '^t') return cycleTheme
    if (key === 'esc') {
      if (phase.name === 'answered') return backToPicking
      return phase.name === 'probing' ||
        phase.name === 'downloading' ||
        phase.name === 'transcribing' ||
        phase.name === 'answering'
        ? cancelRun
        : resetToInput
    }
    if (key === '↵') {
      if (phase.name === 'input') return () => handleUrlSubmit(urlInput)
      if (phase.name === 'picking') return asking ? () => handleAsk(question) : () => handlePick({value: highlightRef.current})
      if (phase.name === 'answered') return backToPicking
      if (phase.name === 'error' || phase.name === 'done') return resetToInput
    }
    return undefined // ↑↓ / ↑ stay keyboard-only
  }
  const clickTargets: ClickTarget[] = []
  if (phase.name === 'input') {
    // the frame button rows above/below the label are part of the button
    clickTargets.push({match: `  ${YOINK_BUTTON}  `, padY: 1, action: () => handleUrlSubmit(urlInput)})
  }
  if (phase.name === 'picking') {
    for (const [index, choice] of choices.entries()) {
      clickTargets.push({match: choiceLabel(choice), action: () => handlePick({value: index})})
    }
  }
  if (phase.name === 'done') {
    clickTargets.push({match: DONE_LABEL, padX: 4, padY: 1, action: resetToInput})
  }
  for (const [key, label] of hints) {
    const action = hintAction(key)
    if (action) clickTargets.push({match: `${key} ${label}`, action})
  }

  useMouseClick(
    (x, y) => {
      // the logo takes you home — it's the 3 rows one gap above the tagline
      const taglineRow = findFrameRow(TAGLINE)
      if (taglineRow > 3 && y - 1 >= taglineRow - 4 && y - 1 <= taglineRow - 2) {
        const span = frameRowSpan(y - 1)
        if (span && x >= span[0] - 1 && x <= span[1] + 1) {
          if (
            phase.name === 'probing' ||
            phase.name === 'downloading' ||
            phase.name === 'transcribing' ||
            phase.name === 'answering'
          )
            cancelRun()
          else if (phase.name !== 'input') resetToInput()
          return
        }
      }
      clickTargetAt(x, y, clickTargets)?.action()
    },
    Boolean(process.stdin.isTTY),
  )

  return (
    <FullScreen>
      <Logo />
      <Gap />
      <Text color={theme.primary}>{TAGLINE}</Text>
      <Text color={theme.gray} dimColor={theme.dimSecondary}>youtube · x · instagram · threads · tiktok · +1800 more</Text>
      <Gap />

      {phase.name === 'input' && (
        <Box flexDirection="column" alignItems="center">
          <FramedInput title="Paste a link" width={boxWidth} button={YOINK_BUTTON}>
            <TextInput
              value={urlInput}
              onChange={setUrlInput}
              onSubmit={handleUrlSubmit}
              placeholder="https://youtube.com/watch?v=…"
              width={boxWidth - 6}
              history={history}
              submitOnPaste={isProbablyUrl}
              onTab={() => {
                if (clipboardOffered) setUrlInput(clipboardUrl!)
              }}
            />
          </FramedInput>
          {phase.warning ? (
            <Text color={theme.gray} dimColor={theme.dimSecondary}>✗ {phase.warning}</Text>
          ) : clipboardOffered ? (
            <Text color={theme.gray} dimColor={theme.dimSecondary}>link in your clipboard — ⇥ to paste it</Text>
          ) : clipboardAccepted ? (
            <Text color={theme.gray} dimColor={theme.dimSecondary}>from your clipboard — ↵ to yoink it</Text>
          ) : null}
        </Box>
      )}

      {phase.name === 'probing' && (
        <Box flexDirection="column" alignItems="center">
          <FramedInput title={platform ? platform.label : 'Paste a link'} width={boxWidth} button={YOINK_BUTTON} buttonDim>
            <Text color={theme.gray} dimColor={theme.dimSecondary}>{url.length > boxWidth - 8 ? `${url.slice(0, boxWidth - 9)}…` : url}</Text>
          </FramedInput>
        </Box>
      )}

      {phase.name === 'picking' && platform && (
        <Box flexDirection="column" alignItems="center">
        <Box width={contentWidth}>
          <Box flexDirection="column" flexGrow={1} flexBasis={0} paddingTop={1} paddingRight={3}>
            {/* wrapped by hand so continuation lines stay flush left —
                ink's wrapping keeps the break's space as a 1-cell indent */}
            {wrapText(info?.title ?? '', Math.max(10, contentWidth - 41)).map((line, index) => (
              <Text key={index} bold color={theme.primary}>
                {line}
              </Text>
            ))}
            <Gap />
            <Text color={theme.gray} dimColor={theme.dimSecondary}>
              ▸ {platform.label}
              {info?.duration ? ` · ${formatDuration(info.duration)}` : ''}
              {info?.uploader ? ` · ${info.uploader}` : ''}
            </Text>
          </Box>
          <Panel title="Save as" width={38}>
            <SelectInput
              indicatorComponent={ChoiceIndicator}
              itemComponent={ChoiceItem}
              items={choices.map((choice, index) => ({
                key: String(index),
                label: choiceLabel(choice),
                value: index,
                // the divider sits after the last video, before the audio/transcript group
                rule: choice.kind === 'video' && choices[index + 1]?.kind !== 'video',
              }))}
              onSelect={handlePick}
              onHighlight={item => (highlightRef.current = item.value)}
              isFocused={!asking}
            />
          </Panel>
        </Box>
          <Gap />
          {/* An answer is not an artifact, so it stays out of the Save as
              panel (CONTEXT.md). The input only mounts while asking — its
              useInput would otherwise swallow the picker's keys. */}
          {asking ? (
            <FramedInput title="ask about it" width={boxWidth}>
              <TextInput
                value={question}
                onChange={setQuestion}
                onSubmit={handleAsk}
                placeholder="what does he say about…?"
                width={boxWidth - 6}
              />
            </FramedInput>
          ) : (
            <Text color={theme.gray} dimColor={theme.dimSecondary}>
              …or just start typing to ask about it
            </Text>
          )}
        </Box>
      )}

      {phase.name === 'downloading' && (
        <Box flexDirection="column" alignItems="center">
          <Text color={theme.gray} dimColor={theme.dimSecondary}>
            {info?.title ? `${truncate(info.title, 42)} · ` : ''}
            {phase.choice.label}
          </Text>
          <Gap />
          {/* every branch is exactly three rows — bar, gap, meta — so the layout never jumps */}
          {phase.processing ? (
            <>
              <ProgressBar percent={1} />
              <Gap />
              <Text>
                <Text color={theme.primary}>
                  <Spinner type="dots" />
                </Text>
                <Text color={theme.gray} dimColor={theme.dimSecondary}> processing…</Text>
              </Text>
            </>
          ) : phase.progress?.totalBytes ? (
            <>
              <ProgressBar percent={phase.progress.downloadedBytes / phase.progress.totalBytes} />
              <Gap />
              <Text color={theme.gray} dimColor={theme.dimSecondary}>{downloadMeta(phase.progress)}</Text>
            </>
          ) : phase.progress ? (
            <>
              <Text>
                <Text color={theme.primary}>
                  <Spinner type="dots" />
                </Text>
                <Text color={theme.gray} dimColor={theme.dimSecondary}> downloading…</Text>
              </Text>
              <Gap />
              <Text color={theme.gray} dimColor={theme.dimSecondary}>{indeterminateMeta(phase.progress)}</Text>
            </>
          ) : (
            <>
              <ProgressBar percent={0} />
              <Gap />
              <Text>
                <Text color={theme.primary}>
                  <Spinner type="dots" />
                </Text>
                <Text color={theme.gray} dimColor={theme.dimSecondary}>
                  {phase.refreshing ? ' link expired — grabbing a fresh one…' : ' starting download…'}
                </Text>
              </Text>
            </>
          )}
        </Box>
      )}

      {phase.name === 'transcribing' && (
        <Box flexDirection="column" alignItems="center">
          <Text color={theme.gray} dimColor={theme.dimSecondary}>
            {info?.title ? `${truncate(info.title, 42)} · ` : ''}
            transcript · txt
          </Text>
          <Gap />
          {/* same three-row shape as downloading — bar, gap, meta — so the layout never jumps */}
          {phase.percent === undefined ? (
            <>
              <ProgressBar percent={0} />
              <Gap />
              <Text>
                <Text color={theme.primary}>
                  <Spinner type="dots" />
                </Text>
                <Text color={theme.gray} dimColor={theme.dimSecondary}> {phase.status}</Text>
              </Text>
            </>
          ) : (
            <>
              <ProgressBar percent={phase.percent} />
              <Gap />
              <Text color={theme.gray} dimColor={theme.dimSecondary}>transcribing with local whisper…</Text>
            </>
          )}
        </Box>
      )}

      {phase.name === 'answering' && (
        <Box flexDirection="column" alignItems="center">
          <Text color={theme.gray} dimColor={theme.dimSecondary}>
            {info?.title ? `${truncate(info.title, 42)}` : ''}
          </Text>
          <Gap />
          <Text>
            <Text color={theme.primary}>
              <Spinner type="dots" />
            </Text>
            <Text color={theme.gray} dimColor={theme.dimSecondary}> {phase.status}</Text>
          </Text>
        </Box>
      )}

      {phase.name === 'answered' && (
        <Box flexDirection="column" width={contentWidth}>
          <Text color={theme.gray} dimColor={theme.dimSecondary}>? {truncate(phase.question, contentWidth - 2)}</Text>
          <Gap />
          {phase.facts.length === 0 ? (
            <Text color={theme.primary}>The source doesn’t answer that.</Text>
          ) : (
            phase.facts.map((fact, index) => (
              <Box key={index} flexDirection="column" flexShrink={0}>
                {wrapText(`[${stamp(fact.at)}] ${fact.text}`, contentWidth).map((line, row) => (
                  <Text key={row} color={row === 0 ? theme.primary : theme.gray} dimColor={row > 0 && theme.dimSecondary}>
                    {line}
                  </Text>
                ))}
              </Box>
            ))
          )}
        </Box>
      )}

      {phase.name === 'done' && (
        <Box flexDirection="column" alignItems="center">
          <Text>
            <Text bold color={theme.primary}>✓ yoinked! </Text>
            <Text color={theme.primary}>find your file in:</Text>
          </Text>
          <Text color={theme.gray} dimColor={theme.dimSecondary}>{shortenPath(phase.filepath, os.homedir(), 60)}</Text>
          <Gap />
          <Box
            borderStyle="round"
            borderColor={theme.gray}
            borderDimColor={theme.dimSecondary}
            borderBackgroundColor={theme.background}
            paddingX={3}
          >
            <Text bold color={theme.primary}>{DONE_LABEL}</Text>
          </Box>
        </Box>
      )}

      {phase.name === 'error' && (
        <Box flexDirection="column" alignItems="center" width={Math.max(10, Math.min(columns - 6, 72))}>
          <Text bold color={theme.primary}>✗ {phase.message}</Text>
        </Box>
      )}

      {hints.length > 0 ? (
        <>
          <Gap lines={2} />
          <Shortcuts
            items={hints}
            leading={
              phase.name === 'probing' ? (
                <Text>
                  <Text color={theme.primary}>
                    <Spinner type="dots" />
                  </Text>
                  <Text color={theme.gray} dimColor={theme.dimSecondary}> {phase.status}</Text>
                </Text>
              ) : undefined
            }
          />
        </>
      ) : null}
    </FullScreen>
  )
}
