import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const HISTORY_FILE = path.join(os.homedir(), '.config', 'yoinks', 'history.json')
const LIMIT = 50

/** A source that produced no file, only an answer. */
export const ASKED = 'asked'

/**
 * One row of the recent list: a source Yoinks did something with, and what
 * came of it. It holds nothing about what the source *said* — the question
 * itself goes to the ask log instead
 * (docs/adr/0008-recent-is-artifacts-not-content.md).
 */
export type RecentRow = {
  url: string
  /** the source's own title, or the url when the platform publishes none */
  title: string
  /** the artifact's extension — mp4, mp3, txt — or `asked` when no file was saved */
  artifact: string
  /** ISO 8601, when it happened */
  at: string
}

const isRow = (value: unknown): value is RecentRow =>
  typeof value === 'object' &&
  value !== null &&
  ['url', 'title', 'artifact', 'at'].every(key => typeof (value as Record<string, unknown>)[key] === 'string')

/** Tolerant of a file written by a different version — junk entries are dropped. */
export function parseHistory(value: unknown): RecentRow[] {
  return Array.isArray(value) ? value.filter(isRow).slice(0, LIMIT) : []
}

/**
 * Newest first, one row per source url, capped. A saved artifact outranks an
 * ask: asking about a source you already yoinked moves the row up without
 * forgetting which file you have.
 */
export function mergeRow(entry: RecentRow, list: RecentRow[]): RecentRow[] {
  const previous = list.find(item => item.url === entry.url)
  const artifact = entry.artifact === ASKED && previous && previous.artifact !== ASKED ? previous.artifact : entry.artifact
  return [{...entry, artifact}, ...list.filter(item => item.url !== entry.url)].slice(0, LIMIT)
}

export function loadHistory(): RecentRow[] {
  try {
    return parseHistory(JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')))
  } catch {
    return []
  }
}

/** Record what happened to a source and persist. Returns the new list. */
export function addToHistory(entry: RecentRow): RecentRow[] {
  const next = mergeRow(entry, loadHistory())
  try {
    fs.mkdirSync(path.dirname(HISTORY_FILE), {recursive: true})
    fs.writeFileSync(HISTORY_FILE, `${JSON.stringify(next, null, 2)}\n`)
  } catch {
    // history is a nicety — never let it break a download
  }
  return next
}
