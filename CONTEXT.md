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
said; without that, an answer cannot be checked.
_Avoid_: Caption file, subtitles

**Skippable region**:
A span of a source that is not the source: a sponsor read, a subscribe interruption, a creator
outro. Marked in time, and always traceable to the line that gave it away.
_Avoid_: Map, chapter, segment, ad break, filler

**Answer**:
Facts drawn from a transcript, each pointing back to where in the source media it came from.
Shown to the person and discarded — an answer is never saved, and so is never an artifact.
_Avoid_: Summary, insights, output
