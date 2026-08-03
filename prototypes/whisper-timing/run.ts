/**
 * PROTOTYPE — throwaway. See README.md for the question and the kill condition.
 *
 * Two rungs over the same six sources, scored against the Step 1 slots:
 *   whisper-cli -ovtt  -> parseCaptions -> detectSkippableRegions
 *   fetchCaptions      -> parseCaptions -> detectSkippableRegions   (control)
 *
 * Everything downstream of the VTT is the product's own code, imported unmodified.
 */

import {spawn} from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {parseCaptions} from '../../src/lib/captions.js'
import {detectSkippableRegions, type Block, type SkippableRegion} from '../../src/lib/skippable.js'
import {fetchCaptions} from '../../src/lib/ytdlp.js'

/**
 * Ground truth from docs/validation/step-1-cold-read.md, in that table's `#` order.
 *
 * `sponsor` is the slot Step 6 scored, so its column is directly comparable.
 * `extra` is the target's second recorded read — Step 1 records the target's as
 * `0:47–2:18 and 25:47–27:17`, and Step 6's table only tracks one slot per
 * source, so this one is reported apart from the six-source tally.
 */
const CORPUS = [
  {n: '1', id: '32iH1WBJbJo', sponsor: 94}, //  1:34
  {n: '2', id: '434cG4g5KLE', sponsor: 46}, //  0:46
  {n: '3', id: 'xmGY276gEFY', sponsor: 91}, //  1:31
  {n: '4', id: 'IfkBQyWuTOE', sponsor: 138}, // 2:18
  {n: '5', id: 'Q4LoxsIwriA', sponsor: 92}, //  1:32
  {n: 'target', id: 'cIgoqAy_Vs8', sponsor: 47, extra: 1547}, // 0:47 and 25:47
]

const WORK = path.join(os.tmpdir(), 'yoinks-whisper-timing-PROTOTYPE-wipe-me')
const MODEL = path.join(os.homedir(), '.cache', 'whisper', 'ggml-base.bin')
const BLOCK = 45

function sh(cmd: string, args: string[], onLine?: (line: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args)
    let tail = ''
    let buffer = ''
    const sink = (chunk: Buffer) => {
      tail = (tail + chunk).slice(-2000)
      if (!onLine) return
      buffer += chunk.toString()
      const lines = buffer.split(/[\n\r]/)
      buffer = lines.pop() ?? ''
      for (const line of lines) onLine(line)
    }
    child.stdout.on('data', sink)
    child.stderr.on('data', sink)
    child.on('error', reject)
    child.on('close', code =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}\n${tail.trim()}`)),
    )
  })
}

async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(() => true, () => false)
}

function mmss(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

/** The whisper rung, cached at every stage so a re-run costs nothing. */
async function whisperVtt(id: string): Promise<string> {
  const vtt = path.join(WORK, `${id}.whisper.vtt`)
  if (await exists(vtt)) return fs.readFile(vtt, 'utf8')

  const audio = path.join(WORK, `${id}.audio`)
  if (!(await exists(audio))) {
    process.stdout.write(`  downloading audio…`)
    await sh('yt-dlp', [
      `https://www.youtube.com/watch?v=${id}`,
      '-f', 'ba/b',
      '--no-playlist', '--no-warnings', '--quiet',
      '-o', audio,
    ])
    process.stdout.write(` done\n`)
  }

  const wav = path.join(WORK, `${id}.wav`)
  if (!(await exists(wav))) {
    process.stdout.write(`  ffmpeg → 16k mono…`)
    // the same conversion transcribe() does
    await sh('ffmpeg', ['-y', '-i', audio, '-vn', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav])
    process.stdout.write(` done\n`)
  }

  const startedAt = Date.now()
  let lastPercent = -1
  await sh(
    'whisper-cli',
    ['-m', MODEL, '-f', wav, '--no-prints', '--print-progress', '-ovtt', '-of', vtt.replace(/\.vtt$/, '')],
    line => {
      const percent = Number(/progress\s*=\s*(\d+)%/.exec(line)?.[1] ?? -1)
      if (percent > lastPercent) {
        lastPercent = percent
        process.stdout.write(`\r  whisper… ${Math.min(100, percent)}%`)
      }
    },
  )
  process.stdout.write(`\r  whisper… done in ${Math.round((Date.now() - startedAt) / 1000)}s\n`)
  return fs.readFile(vtt, 'utf8')
}

/** The control rung: the product's own caption fetch, cached the same way. */
async function captionVtt(id: string): Promise<string | undefined> {
  const cached = path.join(WORK, `${id}.captions.vtt`)
  if (await exists(cached)) return fs.readFile(cached, 'utf8')
  process.stdout.write(`  fetching captions…`)
  const captions = await fetchCaptions({ytdlp: 'yt-dlp', url: `https://www.youtube.com/watch?v=${id}`})
  process.stdout.write(captions ? ` done\n` : ` none\n`)
  if (captions) await fs.writeFile(cached, captions.vtt)
  return captions?.vtt
}

type Alignment = 'exact' | 'within one block' | 'early — unmatched'

type Hit = {region: SkippableRegion; offset: number; alignment: Alignment}

type Score = {
  blocks: number
  words: number
  regions: SkippableRegion[]
  /** Was the read marked at all? Step 6's headline metric — see the note below. */
  sponsor?: Hit
  /** The target's second recorded read, where there is one. */
  extra?: Hit
  /** An outro region starting on the final block. */
  outro?: SkippableRegion
}

/**
 * Was the recorded read marked?
 *
 * Step 6's headline is "sponsor 6 of 6" *with source 4 listed as unmatched* —
 * it counts that source as found and says why: "the recorded slot falls inside
 * the first, so the read is marked — what is off is where the region starts,
 * not whether the read was found." So found means the region overlaps the read,
 * and the exact / within-one-block / unmatched split is a separate breakdown of
 * where the start landed. Both are computed here, and this rule reproduces Step
 * 6's caption column line for line — which is the check that it is Step 6's.
 *
 * Where a read is covered by two regions, the one *containing* the slot is the
 * one scored. Source 4 is why: the detector marks `1:35–2:23` and `2:23–5:33`,
 * and Step 6 scores it unmatched at −43s off the first. Preferring the
 * within-one-block region instead would score it +5s off the second and read
 * 6 of 6 clean, which is the inflation Step 6 explicitly refused.
 */
function hit(sponsors: SkippableRegion[], recorded: number): Hit | undefined {
  const region =
    sponsors.find(r => recorded >= r.start && recorded < r.end) ??
    sponsors.find(r => r.start >= recorded && r.start - recorded <= BLOCK)
  if (!region) return undefined
  const offset = region.start - recorded
  return {
    region,
    offset,
    alignment: offset === 0 ? 'exact' : offset > 0 ? 'within one block' : 'early — unmatched',
  }
}

function score(blocks: Block[], source: {sponsor: number; extra?: number}): Score {
  const regions = detectSkippableRegions(blocks)
  const sponsors = regions.filter(region => region.kind === 'sponsor')
  const finalStart = blocks.at(-1)?.start
  return {
    blocks: blocks.length,
    words: blocks.reduce((total, block) => total + block.text.split(/\s+/).filter(Boolean).length, 0),
    regions,
    sponsor: hit(sponsors, source.sponsor),
    extra: source.extra === undefined ? undefined : hit(sponsors, source.extra),
    outro: regions.find(r => r.kind === 'outro' && r.start === finalStart),
  }
}

function show(h: Hit | undefined): string {
  if (!h) return 'NOT FOUND'
  const sign = h.offset > 0 ? '+' : ''
  return `${mmss(h.region.start)} (${sign}${h.offset}s, ${h.alignment})`
}

function line(label: string, s: Score, hasExtra: boolean): string {
  return [
    `  ${label.padEnd(9)} ${s.blocks} blocks, ${s.words} words`,
    `    sponsor  ${show(s.sponsor)}`,
    ...(hasExtra ? [`    2nd read ${show(s.extra)}`] : []),
    `    outro    ${s.outro ? mmss(s.outro.start) : 'NOT FOUND'}`,
    `    all      ${s.regions.map(r => `${r.kind} ${mmss(r.start)}–${mmss(r.end)} [${r.cues.join(' / ')}]`).join('\n             ') || '(none)'}`,
  ].join('\n')
}

const wanted = process.argv.slice(2)
const corpus = wanted.length ? CORPUS.filter(source => wanted.includes(source.id)) : CORPUS

await fs.mkdir(WORK, {recursive: true})
console.log(`work dir: ${WORK}\n`)

const results: {n: string; id: string; recorded: number; whisper: Score; captions?: Score}[] = []

for (const source of corpus) {
  console.log(`── ${source.n}  ${source.id}  (recorded sponsor ${mmss(source.sponsor)})`)
  const captionsVtt = await captionVtt(source.id)
  const whisper = score(parseCaptions(await whisperVtt(source.id)), source)
  const captions = captionsVtt ? score(parseCaptions(captionsVtt), source) : undefined
  console.log(line('whisper', whisper, source.extra !== undefined))
  if (captions) console.log(line('captions', captions, source.extra !== undefined))
  console.log()
  results.push({...source, recorded: source.sponsor, whisper, captions})
}

const tally = (pick: (r: (typeof results)[number]) => Score | undefined) => ({
  sponsor: results.filter(r => pick(r)?.sponsor).length,
  exact: results.filter(r => pick(r)?.sponsor?.alignment === 'exact').length,
  within: results.filter(r => pick(r)?.sponsor?.alignment === 'within one block').length,
  early: results.filter(r => pick(r)?.sponsor?.alignment === 'early — unmatched').length,
  outro: results.filter(r => pick(r)?.outro).length,
})
const w = tally(r => r.whisper)
const c = tally(r => r.captions)
const n = results.length

console.log(`═══ ${n} sources`)
console.log(`                    whisper   captions`)
console.log(`sponsor found       ${w.sponsor} of ${n}     ${c.sponsor} of ${n}`)
console.log(`  exact             ${w.exact}          ${c.exact}`)
console.log(`  within one block  ${w.within}          ${c.within}`)
console.log(`  early, unmatched  ${w.early}          ${c.early}`)
console.log(`outro found         ${w.outro} of ${n}     ${c.outro} of ${n}`)
console.log(
  `\nkill condition: sponsor < 5 or outro < 5 on whisper → ${
    w.sponsor < 5 || w.outro < 5 ? 'FIRES — does not transfer' : 'does not fire'
  }`,
)

await fs.writeFile(path.join(WORK, 'results.json'), JSON.stringify(results, null, 2))
console.log(`\nfull output: ${path.join(WORK, 'results.json')}`)
