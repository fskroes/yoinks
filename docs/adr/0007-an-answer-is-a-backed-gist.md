# An answer is a gist backed by receipts, never an unbacked conclusion

An answer used to be bare timestamped fact lines and nothing else — the shape
[ADR 0001](0001-facts-never-conclusions.md) prescribed. Real use killed it. The maintainer,
after living with it (2026-08-04): *"I'm just reading lines of text, but I cannot place it
anywhere… I just want to get the gist. I just want my question to be answered in a separate
text block that is based on the transcribing."* Lines that cite perfectly but answer nothing
are not an answer; they are homework.

So the shape reverses. An answer is now:

- a **gist** — at most three sentences of the assistant's own prose, answering the question
  from the transcript;
- backed by **receipts** — at most five timestamped lines, folded away by default and revealed
  on request, each gated exactly as facts were: a line whose time does not resolve to a block
  this source has is dropped ([ADR 0005](0005-a-fact-that-cannot-be-checked-is-not-shown.md)).

The gate extends to the prose: **a gist with no surviving receipt is not shown at all** — the
person sees "the source doesn't answer that," not an unbacked paragraph. This is what keeps
the reversal from being a surrender: the old rule was "never a conclusion," the new rule is
"never an *unbacked* conclusion," and the difference is enforced mechanically, not
aspirationally.

What ADR 0001 protected still stands. Yoinks still never rates, ranks, or recommends a source
— the gist states what the source says, not whether it was worth saying. Only 0001's
*presentation* consequence ("facts only, prefer verbatim over paraphrase") is superseded.

## Consequences

- **One answer shape everywhere.** First ask, follow-up, and expansion all return gist +
  receipts under the same rules and the same gate. Two formats in the prompt rules is where
  drift starts.
- **Streaming dies.** The assistant writes the gist first and the receipts last, so the only
  thing that could stream is the one thing not yet allowed on screen. The answer renders whole
  when it lands; the line-by-line preview (and `factStream`) is deleted with the format that
  needed it.
- **Receipts fold.** The answered screen shows the gist and one line noting how many places in
  the source back it; revealing them brings the old cursor grammar (pick one to expand, esc
  folds before it leaves).
- **"Fact" leaves the vocabulary.** The line was never a fact; it was always a pointer into
  the source. It is a **receipt** now, in the glossary and in the code.
