# Yoinks

Yoinks helps a person get what they came for from media identified by a source URL: either an
artifact saved locally, or an answer about the media that is shown and thrown away.

## Language

**Source URL**:
The URL identifying the remote media from which Yoinks produces an artifact.
_Avoid_: Local file, input file

**Artifact**:
The locally saved result a person chooses, such as a video, audio file, or transcript.
_Avoid_: Format, download format

**Recent**:
The last sources Yoinks did something with, newest first: for each one the source URL, that
source's own title, what came of it — an artifact, or `asked` where the source gave an answer
and no file — and when. It holds nothing about what a source said and no question, so it is a
record of what Yoinks did rather than a library of what a person watched
([ADR 0008](docs/adr/0008-recent-is-artifacts-not-content.md)).
_Avoid_: Library, archive, corpus, history

**Ask log**:
One line per turn, appended to a file Yoinks never reads back and never shows: the question as
it was typed, the source it was asked of, and how the gate went. It exists so the questions can
be counted later, and it holds no word any source said — an expansion records the second it
asked about, not the receipt ([ADR 0009](docs/adr/0009-the-ask-log-is-evidence.md)).
_Avoid_: Analytics, telemetry, corpus, transcript log

**Transcript**:
A timed record of what is said in the source media — taken from the platform's own captions
where they exist, and otherwise recognised from the audio. Every line carries the time it was
said; without that, an answer cannot be checked and no skippable region can be marked. Both
ways of getting one arrive timed, so a source with no captions gives up nothing but the time it
takes to recognise it.
_Avoid_: Caption file, subtitles

**Block**:
One timed paragraph of a transcript — around 45 seconds of what was said, carrying the time
the first line in it landed. It is the unit a skippable region is measured in and the finest
grain anything can be marked at, so it is a domain term rather than a formatting choice.
_Avoid_: Chunk, paragraph, segment

**Skippable region**:
A span of a source that is not the source: a sponsor read, a subscribe interruption, a creator
outro. Marked in time, and always traceable to the line that gave it away.
_Avoid_: Map, chapter, segment, ad break, filler

**Receipt**:
One timestamped line backing an answer, in the source's own words where possible, carrying
the time it was said. The time is not decoration: it is what makes the line checkable, so a
receipt whose time does not resolve to a block this source has is not shown at all, and Yoinks
says how many it dropped, so the check is visible when it fires. Folded away by default;
revealed on request.
_Avoid_: Fact, finding, point, bullet, citation

**Answer**:
A gist of at most three sentences answering a question from the transcript, backed by at most
five receipts. A gist with no surviving receipt is not an answer and is not shown. Shown to
the person and discarded — Yoinks never saves an answer, so it is never an artifact. An
assistant the person runs may keep its own record of the conversation; that record is the
assistant's, not Yoinks'.
_Avoid_: Summary, insights, output

**Expansion**:
A follow-up on one receipt the person selected: what the source says around that receipt's
time and about its subject. An expansion is an answer — the same shape, the same gate, and
the same caps apply, and it replaces nothing the person cannot ask again.
_Avoid_: Drill-down, detail view, more

**Turn**:
One exchange within a conversation: a question or an expansion, and the answer that came
back. Every turn's answer is checked the same way, whatever turn it is.
_Avoid_: Exchange, round, message

**Conversation**:
The sequence of answers and expansions about one source, remembered by the assistant. Yoinks
holds only a handle to it, and drops the handle when the person leaves the source.
_Avoid_: Session, chat, thread
