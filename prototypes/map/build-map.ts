/**
 * PROTOTYPE — throwaway. Answers one question: does a map provoke a question?
 * See ./README.md. Not imported by src/. Do not promote without a rewrite.
 *
 * This file is the part worth keeping if the answer is yes: a pure
 * `transcript -> map` function, no I/O, no terminal, no model, no API key.
 * Arithmetic over a timed transcript, which is all the thesis claims a map is.
 *
 * Bound by ADR 0001: this marks structure and skippable regions. It never
 * scores, ranks, or recommends, and it never paraphrases — the only prose it
 * emits is verbatim from the source.
 */

export type Block = { start: number; text: string };

export type SkipKind = "sponsor" | "outro" | "subscribe";

export type Row = {
  start: number;
  end: number;
  /** Set when this row is a region the person can skip. */
  skip?: { kind: SkipKind; cues: string[] };
  /** Verbatim, from the source. Empty on a skippable row. */
  turnLine: string;
  /** Terms distinctive to this row versus the rest of the source. */
  terms: string[];
};

export type SourceMap = {
  title: string;
  url: string;
  /** Last caption + one block. The true duration is not in a transcript. */
  endsAbout: number;
  words: number;
  rows: Row[];
};

// ---------------------------------------------------------------- parsing

const ENTITIES: Record<string, string> = {
  "&gt;": ">",
  "&lt;": "<",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

function decode(s: string): string {
  return s.replace(/&(gt|lt|amp|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m);
}

const STAMP = /^\[(?:(\d+):)?(\d+):(\d\d)\]\s*/;

/** Parse the markdown that `~/yoinks-corpus/bin/pull` writes. */
export function parseTranscript(md: string): {
  title: string;
  url: string;
  blocks: Block[];
} {
  const lines = md.split("\n");
  const title = lines.find((l) => l.startsWith("# "))?.slice(2).trim() ?? "(untitled)";
  const url = lines.find((l) => l.startsWith("Source: "))?.slice(8).trim() ?? "";

  const blocks: Block[] = [];
  for (const line of lines) {
    const m = STAMP.exec(line);
    if (!m) continue;
    const [, h, mm, ss] = m;
    const start = (h ? Number(h) * 3600 : 0) + Number(mm) * 60 + Number(ss);
    const text = decode(line.slice(m[0].length)).replace(/\s+/g, " ").trim();
    if (text) blocks.push({ start, text });
  }
  return { title, url, blocks };
}

// ------------------------------------------------------------ tokenising

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
);

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [])
    .map((w) => w.replace(/'(ll|re|ve|d|t|m|s)$/, "").replace(/'$/, ""))
    .filter((w) => w.length >= 3 && !STOP.has(w));
}

function bag(list: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of list) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [w, n] of a) dot += n * (b.get(w) ?? 0);
  if (dot === 0) return 0;
  let na = 0;
  let nb = 0;
  for (const n of a.values()) na += n * n;
  for (const n of b.values()) nb += n * n;
  return dot / Math.sqrt(na * nb);
}

// ------------------------------------------------------- skippable regions

const CUES: Record<SkipKind, RegExp[]> = {
  // A bare "sponsor" is a mention, not a read — Theo says "money I got from
  // sponsors" 36 minutes in. Match the phrases that open or close a read.
  sponsor: [
    /\btoday'?s sponsor\b/,
    /\bthis (video|episode) is sponsored\b/,
    /\bsponsored by\b/,
    /\bour sponsor\b/,
    /\bthanks? to \w+ for sponsoring\b/,
    /\bbrought to you by\b/,
    /\bcheck (them|it) out at\b/,
    /\bsign up (at|for)\b/,
    /\blink (is )?in the (description|comments)\b/,
    /\buse (the )?(promo )?code\b/,
    /\bfree trial\b/,
    /\bquick break\b/,
    /\ba word from\b/,
  ],
  outro: [
    /\bthanks? (you )?(all |guys )?for watching\b/,
    /\bsee (you|ya) (in the )?next (one|video|time)\b/,
    /\buntil next time\b/,
    /\bcatch you (in the )?next\b/,
    /\bthat'?s (it|all) for (today|this one)\b/,
  ],
  // Same trap as a bare "sponsor": Theo says "subscribe" in passing 45 minutes
  // into a video about models. Only the imperative counts as an interruption.
  subscribe: [
    /\b(please |go |do )?subscribe (to|for|and|if|now|below)\b/,
    /\b(make sure|don'?t forget|be sure) (to|and) subscribe\b/,
    /\bhit (the bell|subscribe)\b/,
    /\bsmash (that |the )?like\b/,
    /\b(like|drop) (a |the |this )?(like|video) (and|if|for)\b/,
    /\bjoin (the |our )?(discord|patreon)\b/,
    // Corroboration only — see NEEDS_TWO below.
    /\bearly access\b/,
    /\bclick(ing)? the link\b/,
    /\bthe bell\b/,
    /\bnotification(s)?\b/,
    /\bnewsletter\b/,
  ],
};

/**
 * "Subscribe" needs two cues, the others need one. A video about paying for AI
 * models says "subscribe to" constantly and means none of it; a real
 * interruption also mentions the bell, early access, or a link. Sponsor and
 * outro phrasings have no such innocent twin.
 */
const NEEDS_TWO: Partial<Record<SkipKind, boolean>> = { subscribe: true };

/** How far past its cue a region of this kind may be grown, in blocks. */
const REACH: Record<SkipKind, number> = { sponsor: 3, subscribe: 1, outro: 0 };

/** Which cue phrases fire in this block, if any. Order = precedence. */
function skipCues(text: string): { kind: SkipKind; cues: string[] } | undefined {
  const lower = text.toLowerCase();
  for (const kind of ["sponsor", "outro", "subscribe"] as SkipKind[]) {
    const cues = CUES[kind].filter((re) => re.test(lower)).map((re) => re.source);
    if (cues.length >= (NEEDS_TWO[kind] ? 2 : 1)) return { kind, cues };
  }
  return undefined;
}

/**
 * A cue phrase fires once, at the top of a read; the middle of a sponsor read
 * never says "sponsor". Grow each seed forward while the next block keeps
 * saying a word that is rare everywhere else in the source — which is what a
 * read does, because it repeats the product's name and nothing else does.
 *
 * Whole-block similarity was tried first and never fired once across the three
 * sources: a seed block is half content and half ad, so it resembles its
 * neighbour less than the median pair does.
 */
function growSkips(blocks: Block[], skips: (ReturnType<typeof skipCues>)[]): void {
  const bags = blocks.map((b) => bag(tokens(b.text)));
  const df = new Map<string, number>();
  for (const b of bags) for (const w of b.keys()) df.set(w, (df.get(w) ?? 0) + 1);
  const rareIn = Math.max(2, Math.round(blocks.length * 0.15));

  const seeds = skips.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
  for (const i of seeds) {
    const brand = [...bags[i].keys()].filter((w) => (df.get(w) ?? 0) <= rareIn);
    const reach = REACH[skips[i]!.kind];
    if (!brand.length || !reach) continue;
    for (let k = i + 1; k < Math.min(blocks.length, i + 1 + reach); k++) {
      if (skips[k] || !brand.some((w) => bags[k].has(w))) break;
      skips[k] = { kind: skips[i]!.kind, cues: ["grown from " + stampish(blocks[i].start)] };
    }
  }
}

function stampish(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

// ----------------------------------------------------------- segmentation

/**
 * TextTiling. Similarity of the window before each gap to the window after it;
 * a boundary is a gap that both neighbours score higher than, by enough.
 */
function topicalBoundaries(blocks: Block[], window = 2, minRun = 2): Set<number> {
  const bags = blocks.map((b) => bag(tokens(b.text)));
  const gaps: number[] = [];
  for (let i = 1; i < blocks.length; i++) {
    const left = new Map<string, number>();
    const right = new Map<string, number>();
    for (let k = Math.max(0, i - window); k < i; k++)
      for (const [w, n] of bags[k]) left.set(w, (left.get(w) ?? 0) + n);
    for (let k = i; k < Math.min(blocks.length, i + window); k++)
      for (const [w, n] of bags[k]) right.set(w, (right.get(w) ?? 0) + n);
    gaps.push(cosine(left, right));
  }

  // Depth: how far this gap sits below the nearest peak on either side.
  const depths = gaps.map((sim, i) => {
    let l = sim;
    for (let k = i - 1; k >= 0 && gaps[k] >= l; k--) l = gaps[k];
    let r = sim;
    for (let k = i + 1; k < gaps.length && gaps[k] >= r; k++) r = gaps[k];
    return l - sim + (r - sim);
  });

  const mean = depths.reduce((a, b) => a + b, 0) / (depths.length || 1);
  const sd = Math.sqrt(
    depths.reduce((a, b) => a + (b - mean) ** 2, 0) / (depths.length || 1),
  );
  const cutoff = mean + sd / 2;

  const ranked = depths
    .map((d, i) => ({ d, at: i + 1 }))
    .filter((x) => x.d > cutoff)
    .sort((a, b) => b.d - a.d);

  const out = new Set<number>();
  for (const { at } of ranked) {
    if ([...out].some((b) => Math.abs(b - at) < minRun)) continue;
    if (at < minRun || at > blocks.length - minRun) continue;
    out.add(at);
  }
  return out;
}

// ------------------------------------------------------------- turn lines

/**
 * The first whole sentence in a run. Blocks are cut on a clock, so the first
 * fragment is usually mid-sentence — skip it rather than quote half of it.
 */
function turnLine(text: string, atStart: boolean, limit = 150): string {
  const parts = text.split(/(?<=[.?!])\s+/);
  // Every run but the first opens mid-sentence, because blocks are cut on a
  // clock. Drop that fragment rather than quote half of it.
  const rest = !atStart && parts.length > 1 ? parts.slice(1) : parts;
  const from = Math.max(0, rest.findIndex((s) => words(s) >= 6));
  let out = "";
  for (let i = from; i < rest.length && out.length < 40; i++) {
    out = (out + " " + rest[i]).trim();
  }
  // ">>" is the auto-subs' speaker-change marker; it is structure, not speech.
  out = out.replace(/>{2,}\s*/g, "").replace(/\[\s*__\s*\]/g, "[…]").trim();
  return out.length > limit ? out.slice(0, limit - 1).trimEnd() + "…" : out;
}

function words(s: string): number {
  return s.replace(/>{2,}/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

// ------------------------------------------------------------------ build

export function buildMap(md: string): SourceMap {
  const { title, url, blocks } = parseTranscript(md);
  if (!blocks.length) throw new Error("no timestamped blocks in that transcript");

  const skips = blocks.map((b) => skipCues(b.text));
  growSkips(blocks, skips);
  const bounds = topicalBoundaries(blocks);

  // Cut on a topic boundary, or wherever the skippable label changes.
  const cuts: number[] = [0];
  for (let i = 1; i < blocks.length; i++) {
    const changed = (skips[i]?.kind ?? null) !== (skips[i - 1]?.kind ?? null);
    // A subject change inside a sponsor read is not a subject change in the
    // source; splitting there prints the same skippable row twice.
    const inSkip = skips[i] && skips[i - 1];
    if (changed || (bounds.has(i) && !inSkip)) cuts.push(i);
  }

  const runs = cuts.map((from, i) => ({
    from,
    to: i + 1 < cuts.length ? cuts[i + 1] : blocks.length,
  }));

  // tf-idf, treating each run as a document, so terms shared by the whole
  // source drop out and what is peculiar to a run survives.
  const runBags = runs.map((r) =>
    bag(blocks.slice(r.from, r.to).flatMap((b) => tokens(b.text))),
  );
  const df = new Map<string, number>();
  for (const b of runBags) for (const w of b.keys()) df.set(w, (df.get(w) ?? 0) + 1);

  const rows: Row[] = runs.map((r, i) => {
    const b = runBags[i];
    const total = [...b.values()].reduce((a, n) => a + n, 0) || 1;
    const terms = [...b.entries()]
      .filter(([, n]) => n >= 2 || runs.length < 4)
      .map(([w, n]) => ({ w, s: (n / total) * Math.log(runs.length / (df.get(w) ?? 1)) }))
      .sort((a, b2) => b2.s - a.s)
      .slice(0, 4)
      .map((x) => x.w);

    const skip = skips[r.from];
    const text = blocks.slice(r.from, r.to).map((x) => x.text).join(" ");
    return {
      start: blocks[r.from].start,
      end: r.to < blocks.length ? blocks[r.to].start : blocks[blocks.length - 1].start + 45,
      skip,
      turnLine: skip ? "" : turnLine(text, r.from === 0),
      terms: skip ? [] : terms,
    };
  });

  return {
    title,
    url,
    endsAbout: blocks[blocks.length - 1].start + 45,
    words: blocks.reduce((a, b) => a + b.text.split(/\s+/).length, 0),
    rows,
  };
}
