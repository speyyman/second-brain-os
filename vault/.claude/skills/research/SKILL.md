---
name: research
description: "Turn a source, clipping or topic into a research note in the vault's Research shape. Use for research this, make a note from this link, or expanding an existing study note."
argument-hint: "<link, note or topic>"
---

# Research note

Make a research note from: $ARGUMENTS

Follow AGENTS.md, including Privacy.

## Gather before writing

If the argument names a note already in the vault (for example a clipping in `00 Inbox`), work on that note. Otherwise search for an existing note on the topic and extend it rather than starting a second one. Read the source fully. Never put vault text into web searches.

## Structure

```yaml
---
created: <YYYY-MM-DDTHH:mm>
updated: <YYYY-MM-DDTHH:mm>
type: research
status: inbox
spark: false
source: <main URL, book or [[note]]>
tags: []
aliases: []
---
```

Then the sections `## What I looked up and why`, `## What I found`, `## Sparks` and `## Related`. Keep a clipping's original text under `## Clipped text` at the bottom.

## Style

Draft "What I found" in flowing paragraphs, in plain language, as if explaining to a smart friend. Paraphrase rather than quote at length. Separate what the source claims from what is well established, flag doubtful points with `> [!caution] Uncertain`, and name the limits of the idea. Leave "What I looked up and why" and "Sparks" for the owner, keeping anything they already wrote; you may suggest sparks in your reply.

## Links and properties

Link real notes with `[[Exact Title]]` and check that they exist. Put the main source in `source`, add `aliases` people would search for, and use lowercase hyphenated `tags` that match ones already in the vault. A note that serves a project gets `type: project-note`, `project: "[[Hub]]"` and a sentence in the hub's Files section. A new note goes in `30 Research`; moving an existing Inbox note there goes through Obsidian.

Finish with a two-line summary, the `[[link]]`, and one or two possible sparks, without ticking `spark` yourself.
