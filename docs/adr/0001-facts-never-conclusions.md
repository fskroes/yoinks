# Yoinks states facts about a source, never conclusions about it

Yoinks can tell a person what is in a source and where, but it never scores, ranks, or
recommends: no worth-watching verdict, no "skip this one", no confidence rating on the source
itself. The person decides; Yoinks hands them what they need to decide with and stops.

This is a deliberate reversal, not an omission. A verdict-shaped output was proposed during
the 2026-07-25 design session — along with a regret metric that would have measured how often
the verdict made you skip something good — and the maintainer killed it in one sentence: *"I
will decide self if I find it valueable to watch the video or not."* Everything factual
survived that cut (timestamped claims, verbatim quotes, expandable depth, detected sponsor
reads); everything evaluative died with it.

## Consequences

The constraint is load-bearing for two later decisions and is easy to violate by accident:

- The no-question path returns a **map** — the shape of a source, its segment boundaries and
  its skippable regions — rather than an account of what the source says. Structure cannot
  express an opinion; prose about content always can, and drifts into one.

  *Amended by [ADR 0003](0003-skippable-regions-not-a-map.md), 2026-08-01: "structure cannot
  express an opinion" was too generous to itself. A segment boundary is an inference about
  where the subject changes with nothing in the transcript to check it against — this
  constraint rules it out, and it took two failed measurements to notice. The no-question path
  returns marked **skippable regions**, which are facts. The constraint below is unchanged.*
  *Amended by [ADR 0007](0007-an-answer-is-a-backed-gist.md), 2026-08-05: the presentation
  consequence below is superseded. An answer now leads with a short prose gist, backed by
  gated, timestamped receipts — real use showed bare fact lines could not be placed in the
  source they came from. The core constraint — no verdicts, no rankings, no worth-watching —
  is unchanged; a gist with no surviving receipt is not shown at all.*
- "Prefer verbatim over paraphrase" exists for the same reason. A summary flattens a weak
  thinker and a strong one into the same competent prose, which is a judgment about the
  source smuggled in as a writing style.

Every comparable product ships a score, so expect this to be re-proposed by well-meaning
contributors. The answer is here rather than in a session log so it does not have to be
re-argued from scratch.
