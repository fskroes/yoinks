/**
 * PROTOTYPE — throwaway shell.
 *
 *   npm run prototype:map -- <transcript.md | youtube-url>
 *   npm run prototype:map -- <...> --strict   times + skippable only
 *   npm run prototype:map -- <...> --plain    no colour, for pasting
 *
 * A URL is pulled with ~/yoinks-corpus/bin/pull (auto-subs, Step 2's tooling).
 * Nothing is written except that transcript. No state, no cache.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { buildMap } from "./build-map.js";
import { render } from "./render.js";

const CORPUS = join(homedir(), "yoinks-corpus");

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const plain = args.includes("--plain");
const target = args.find((a) => !a.startsWith("--"));

if (!target) {
  console.error("usage: npm run prototype:map -- <transcript.md | url> [--strict] [--plain]");
  process.exit(1);
}

/**
 * Same tooling as ~/yoinks-corpus/bin/pull — yt-dlp auto-subs, then Step 2's
 * vtt2txt.py — but into a temp dir that is deleted straight after.
 *
 * `pull` writes into the corpus, which would both add files to Step 2's closed
 * record and have this prototype accumulate transcripts, which is the thing
 * Constraint 4 forbids. The map is arithmetic; it needs to keep nothing.
 */
function pullToTemp(url: string): string {
  const tmp = mkdtempSync(join(tmpdir(), "yoinks-map-"));
  try {
    execFileSync(
      "yt-dlp",
      ["--skip-download", "--write-auto-subs", "--sub-lang", "en", "--sub-format", "vtt",
       "--print-to-file", "%(title)s", join(tmp, "title"), "-o", join(tmp, "sub"), url],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
    const vtt = readdirSync(tmp).find((f) => f.endsWith(".vtt"));
    if (!vtt) throw new Error("no auto-subs available for that source");
    const body = execFileSync("python3", [join(CORPUS, "bin", "vtt2txt.py"), join(tmp, vtt)], {
      encoding: "utf-8",
      maxBuffer: 64 * 1024 * 1024,
    });
    const title = readFileSync(join(tmp, "title"), "utf-8").trim();
    return `# ${title}\n\nSource: ${url}\n\n${body}`;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const md = /^https?:\/\//.test(target)
  ? (process.stderr.write("pulling auto-subs…\n"), pullToTemp(target))
  : readFileSync(target, "utf-8");

console.log("");
console.log(render(buildMap(md), { strict, plain }));
