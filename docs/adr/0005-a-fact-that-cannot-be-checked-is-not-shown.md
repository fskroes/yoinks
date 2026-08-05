# A fact that cannot be checked is not shown

Every line of an answer must carry a timestamp that resolves to a block the source actually
has. A line that carries no timestamp, or one pointing at a time this source never recorded,
is dropped in `parseFacts` and never reaches a person. Yoinks does not ask the assistant
nicely and hope; it checks, and discards what fails.

## Why

[ADR 0001](0001-facts-never-conclusions.md) says Yoinks states facts and hands the person what
they need to check them. Until now that was a constraint on what Yoinks *wrote*, and Yoinks
wrote everything, so stating it was close enough to enforcing it.

Answering breaks that. The words come from an assistant on the person's PATH
([ADR 0002](0002-drive-an-assistant-on-path.md)), which Yoinks does not control and cannot
audit. A fabricated citation is the worst failure available: unlike a bad summary, which reads
as a bad summary, `[7:13] "he said the thing"` is indistinguishable from a true citation until
somebody opens the source and looks. It is a conclusion wearing a fact's clothes — precisely
what ADR 0001 exists to stop — and it arrives *through* the one mechanism that document assumed
was trustworthy.

So the constraint stops being a rule the prompt asks for and becomes a property the code
enforces. The prompt still asks; the parser is what makes it true.

`docs/validation/step-7-answering.md` measured the rate: across 93 facts, one carried a
timestamp that is not a block in the source. That number is the argument. At zero this would be
defensive programming; at 1% it is the difference between a product that states facts and one
that states facts and quietly invents one every so often, in the one place nobody can see it.

## Considered options

- **Trust the prompt.** The rules already tell the assistant to copy the timestamp exactly. It
  mostly obeys. Rejected on the measurement: mostly is a defect when the failure is invisible,
  and prompts are not a place to put an invariant.
- **Show the unresolved line, marked as unverified.** More information, and it lets the person
  judge. Rejected because a marked-uncertain fact is still a claim about the source that Yoinks
  cannot support, and the mark is doing exactly the work ADR 0001 says not to ask a reader to
  do. It also makes the common case noisier to protect against the rare one.
- **Repair the citation by searching the transcript for the quoted text.** Tempting, and it
  would rescue most fabrications. Rejected because it invents provenance: the assistant did not
  read it there, and Yoinks would be manufacturing the very thing whose absence it detected.

## Consequences

- **An answer can come back shorter than the assistant produced.** That is intended and is not
  reported as an error — the dropped lines are counted in `ParsedAnswer.dropped` so the cost is
  visible to callers, but a person is shown only what survived.
- **The check is exact-match against a block start, not a range.** A block is ~45 seconds
  (`CONTEXT.md`), the prompt hands the assistant those exact stamps, and accepting anything
  inside a span would make the check nearly unfalsifiable — every timestamp in the source's
  runtime would resolve.
- **A source with no captions cannot be asked about at all.** Whisper returns words with no
  times, so every fact would fail this check and the honest answer is to say so up front rather
  than run a query that can only produce nothing. Closing that is option (a) of
  [issue #5](https://github.com/fskroes/yoinks/issues/5).

  *Closed 2026-08-03,* with [ADR 0004](0004-the-transcript-artifact-is-timed-and-marked.md) and
  for the same reason: the premise was never true of whisper, only of the `--no-timestamps` flag
  this code passed it. `whisper-cli -ovtt` returns timed cues, so a caption-less source now
  produces blocks a fact can point at and the refusal lost its basis — the answer path recognises
  the audio instead of declining. The check itself is unchanged: facts are still exact-matched
  against block starts, and a fact whose stamp is not a block this source has is still dropped.
  Driven through the CLI on a caption-less source in
  [`step-9-whisper-timing.md`](../validation/step-9-whisper-timing.md), the answer came back as
  five facts, every one of them stamped and every one surviving the check.
- **Expect "why did it drop half my answer" to be asked.** The answer is that the dropped half
  pointed at times the source does not have. Surfacing a count is a reasonable future change;
  showing the content is not.
