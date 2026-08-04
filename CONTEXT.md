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

**Fact**:
One thing the source says, in the source's own words where possible, carrying the time it was
said. The time is not decoration: it is what makes the claim checkable, so a fact whose time
does not resolve to a block this source has is not shown at all.
_Avoid_: Finding, point, bullet, citation

**Answer**:
Facts drawn from a transcript, each pointing back to where in the source media it came from.
Shown to the person and discarded — Yoinks never saves an answer, so it is never an artifact.
An assistant the person runs may keep its own record of the conversation; that record is the
assistant's, not Yoinks'.
_Avoid_: Summary, insights, output

**Expansion**:
A follow-up on one fact the person selected: more facts from the neighbourhood of that fact's
time and about its subject. An expansion is an answer — the same checkability rule and the
same cap apply, and it replaces nothing the person cannot ask again.
_Avoid_: Drill-down, detail view, more

**Turn**:
One exchange within a conversation: a question or an expansion, and the answer that came
back. Every turn's answer is checked the same way, whatever turn it is.
_Avoid_: Exchange, round, message

**Conversation**:
The sequence of answers and expansions about one source, remembered by the assistant. Yoinks
holds only a handle to it, and drops the handle when the person leaves the source.
_Avoid_: Session, chat, thread
