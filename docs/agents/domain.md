# Domain Docs

How engineering skills should consume this repo’s domain documentation.

## Before exploring, read these

- `CONTEXT.md` at the repository root.
- `docs/adr/` for decisions touching the area being changed.

If these files don’t exist, proceed silently. The domain-modeling workflow creates them lazily when terminology or architectural decisions are resolved.

## File structure

This is a single-context repository:

/
├── CONTEXT.md
├── docs/adr/
└── src/

## Use the glossary’s vocabulary

When output names a domain concept—in an issue title, refactor proposal, hypothesis, or test name—use the term defined in `CONTEXT.md`.

If the concept isn’t in the glossary, reconsider whether the term belongs or note the gap for domain modeling.

## Flag ADR conflicts

If output contradicts an existing ADR, surface the conflict explicitly instead of silently overriding it.
