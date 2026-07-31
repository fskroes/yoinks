/** PROTOTYPE — throwaway shell. The map itself lives in ./build-map.ts. */

import type { SourceMap } from "./build-map.js";

const B = "\x1b[1m";
const D = "\x1b[2m";
const R = "\x1b[0m";

export type RenderOpts = {
  /** The literal reading of the thesis: structure and times, nothing else. */
  strict?: boolean;
  /** No escape codes, for pasting into a recording sheet. */
  plain?: boolean;
};

function stamp(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function span(sec: number): string {
  const m = Math.round(sec / 60);
  return m < 1 ? `${Math.round(sec)}s` : `${m}m`;
}

export function render(map: SourceMap, opts: RenderOpts = {}): string {
  const b = opts.plain ? "" : B;
  const d = opts.plain ? "" : D;
  const r = opts.plain ? "" : R;

  const out: string[] = [];
  out.push(`${b}${map.title}${r}`);
  out.push(`${d}${map.url}${r}`);
  out.push(
    `${d}~${stamp(map.endsAbout)} · ${map.words.toLocaleString()} words · ${map.rows.length} segments${r}`,
  );
  out.push("");

  for (const row of map.rows) {
    const time = `${stamp(row.start)}–${stamp(row.end)}`.padEnd(15);
    const len = span(row.end - row.start).padStart(4);

    if (row.skip) {
      out.push(`  ${d}${time}${len}  ▓▓ skippable · ${row.skip.kind}${r}`);
      out.push("");
      continue;
    }

    out.push(`  ${b}${time}${r}${d}${len}${r}`);
    if (!opts.strict) {
      if (row.turnLine) out.push(`  ${d}│${r} "${row.turnLine}"`);
      if (row.terms.length) out.push(`  ${d}│ ${row.terms.join(" · ")}${r}`);
    }
    out.push("");
  }

  if (opts.strict) {
    out.push(`${d}--strict: times and skippable regions only.${r}`);
  }
  return out.join("\n");
}
