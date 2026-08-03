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
Shown to the person and discarded — an answer is never saved, and so is never an artifact.
_Avoid_: Summary, insights, output
