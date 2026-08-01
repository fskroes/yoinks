/**
 * Skippable regions: the spans of a source that are not the source — a sponsor
 * read, a subscribe interruption, a creator outro.
 *
 * Arithmetic and phrase matching over a timed transcript. No I/O, no terminal,
 * no model, no API key.
 *
 * Bound by ADR 0001: a region is a fact, so it carries the line that gave it
 * away, verbatim, for a person to check against the source. It never scores,
 * ranks, or recommends, and it never says where the subject changes — that is
 * an inference the transcript cannot check (ADR 0003).
 */

export type Block = {start: number; text: string}

export type SkipKind = 'sponsor' | 'outro' | 'subscribe'

export type SkippableRegion = {
  /** Seconds into the source, from the block whose line fired the cue. */
  start: number
  end: number
  kind: SkipKind
  /** Verbatim from the source: every phrase in that line which marked it. */
  cues: string[]
}

/**
 * A bare "sponsor" is a mention, not a read — one source says "money I got
 * from sponsors" 36 minutes into unrelated content. Match the phrases that
 * open or close a read instead.
 */
const CUES: Record<SkipKind, RegExp[]> = {
  sponsor: [
    /\btoday'?s sponsor\b/i,
    /\bthis (video|episode) is sponsored\b/i,
    /\bsponsored by\b/i,
    /\bour sponsor\b/i,
    /\bthanks? to \w+ for sponsoring\b/i,
    /\bbrought to you by\b/i,
    /\bcheck (them|it) out at\b/i,
    /\bsign up (at|for)\b/i,
    /\blink (is )?in the (description|comments)\b/i,
    /\buse (the )?(promo )?code\b/i,
    /\bfree trial\b/i,
    /\bquick break\b/i,
    /\ba word from\b/i,
  ],
  outro: [
    /\bthanks? (you )?(all |guys )?for watching\b/i,
    /\bsee (you|ya) (in the )?next (one|video|time)\b/i,
    /\buntil next time\b/i,
    /\bcatch you (in the )?next\b/i,
    /\bthat'?s (it|all) for (today|this one)\b/i,
  ],
  subscribe: [
    /\b(please |go |do )?subscribe (to|for|and|if|now|below)\b/i,
    /\b(make sure|don'?t forget|be sure) (to|and) subscribe\b/i,
    /\bhit (the bell|subscribe)\b/i,
    /\bsmash (that |the )?like\b/i,
    /\b(like|drop) (a |the |this )?(like|video) (and|if|for)\b/i,
    /\bjoin (the |our )?(discord|patreon)\b/i,
    // Corroboration only — see NEEDED below.
    /\bearly access\b/i,
    /\bclick(ing)? the link\b/i,
    /\bthe bell\b/i,
    /\bnotification(s)?\b/i,
    /\bnewsletter\b/i,
  ],
}

/** Order is precedence: the first kind to fire claims the block. */
const KINDS: SkipKind[] = ['sponsor', 'outro', 'subscribe']

/**
 * How many cues a kind needs before it counts as an interruption. A video
 * *about* paying for models says "subscribe to" constantly and means none of
 * it, so subscribe needs a second phrase — the bell, early access, a link — to
 * corroborate the first. Sponsor and outro phrasings have no such innocent twin.
 */
const NEEDED: Record<SkipKind, number> = {sponsor: 1, outro: 1, subscribe: 2}

/**
 * How far past its cue a region of this kind may be grown, in blocks. An outro
 * runs to the end of the source, so it has nowhere to grow to.
 */
const REACH: Record<SkipKind, number> = {sponsor: 3, subscribe: 1, outro: 0}

const STOP = new Set(
  `a about actually after again all also always am an and another any anything are around as at
   back basically be because been before being better bit both but by came can cannot could
   couldn day did didn different do does doesn doing don done down each either else enough even
   ever every everything few first for from get gets getting give go going gonna good got great
   guys had happen has have haven having he her here hers him his how huh i if in into is isn it
   its just keep kind know later least let like little ll lot lots made make makes making many
   maybe me mean means might mine more most much must my need never new next no not nothing now
   of off oh ok okay on once one only or other our out over own part people pretty probably put
   quite re real really right said same say saying says see seen set she should so some
   somebody someone something sort still such super sure take takes talk talking than that thats
   the their them then there these they thing things think this those though thought three
   through time to too try trying two uh um up us use used using ve very want wanted was way we
   well were what when where whether which while who why will with without won would ye yeah
   year years yes yet you your yours`
    .split(/\s+/)
    .filter(Boolean),
)

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [])
    .map(word => word.replace(/'(ll|re|ve|d|t|m|s)$/, '').replace(/'$/, ''))
    .filter(word => word.length >= 3 && !STOP.has(word))
}

/**
 * How long a source's last block runs for. A transcript records when a line was
 * said, never when it stopped, so the source's own median spacing is the only
 * honest estimate available — a constant here would be a number fitted to one
 * corpus, which is the property this detector is trusted for not having.
 */
function medianSpacing(blocks: Block[]): number {
  const gaps = blocks
    .slice(1)
    .map((block, i) => block.start - blocks[i].start)
    .sort((a, b) => a - b)
  if (!gaps.length) return 0
  const mid = Math.floor(gaps.length / 2)
  return gaps.length % 2 === 1 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2
}

/** The cue phrases that fire in this line, verbatim as the source said them. */
function cuesIn(text: string): {kind: SkipKind; cues: string[]} | undefined {
  for (const kind of KINDS) {
    const cues = CUES[kind]
      .map(cue => cue.exec(text)?.[0])
      .filter(hit => hit !== undefined)
    if (cues.length >= NEEDED[kind]) return {kind, cues}
  }
  return undefined
}

export function detectSkippableRegions(blocks: Block[]): SkippableRegion[] {
  const spacing = medianSpacing(blocks)
  const seeds = blocks.map(block => cuesIn(block.text))
  const words = blocks.map(block => new Set(tokens(block.text)))

  // A word is the read's own if the rest of the source hardly ever says it.
  // The threshold is a share of this source's own length, never a constant: a
  // number fitted to one corpus would not survive the next source.
  const sources = new Map<string, number>()
  for (const inBlock of words) {
    for (const word of inBlock) sources.set(word, (sources.get(word) ?? 0) + 1)
  }
  const rareIn = Math.max(2, Math.round(blocks.length * 0.15))

  const regions: SkippableRegion[] = []
  let grownThrough = -1
  for (const [i, seed] of seeds.entries()) {
    if (!seed || i <= grownThrough) continue

    const brand = [...words[i]].filter(word => (sources.get(word) ?? 0) <= rareIn)
    let last = i
    for (let k = i + 1; k < Math.min(blocks.length, i + 1 + REACH[seed.kind]); k++) {
      // A block that fired its own cue starts its own region, and a block that
      // has stopped saying the product's name is back to being the source.
      if (seeds[k] || !brand.some(word => words[k].has(word))) break
      last = k
    }
    grownThrough = last

    regions.push({
      start: blocks[i].start,
      end: blocks[last + 1]?.start ?? blocks[last].start + spacing,
      kind: seed.kind,
      cues: seed.cues,
    })
  }
  return regions
}
