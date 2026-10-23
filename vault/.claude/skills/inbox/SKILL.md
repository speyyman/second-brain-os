---
name: inbox
description: "Sort the notes in 00 Inbox into their folders with the right type, merging duplicates. Use for sort my inbox, step 1 of the weekly review, or strays at the vault root."
argument-hint: "[go]"
disable-model-invocation: true
---

# Sort the Inbox

Arguments: $ARGUMENTS

Sorting is the only time this vault asks for decisions, so make them cheap: propose, let the owner glance, then do it. Follow AGENTS.md.

## 1. Read everything first

List `00 Inbox` and any stray `.md` files at the root other than `Home.md`, `AGENTS.md` and `CLAUDE.md`. Read each note completely; never decide from the title. Search the vault for an existing note on the same subject, so duplicates get merged rather than filed twice. Tidy as you read: remove tracking parameters from `source` links, remove leftover Templater commands, and flag names that still say "Untitled" or "Pasted image".

## 2. Decide a destination for each note

Ask in order and stop at the first yes:

1. Has a finish line, or belongs to a project? `20 Projects/<Project>/`, with `type: project-note` and `project: "[[Hub]]"`.
2. Looked up from outside? `30 Research/`, with `type: research`.
3. Came from the owner's head? `40 Mind/`, with `type: daydream` for a scene or `mind` for a reflection.
4. An ongoing part of life? `50 Life/` (people in `50 Life/People/`), with `type: life`.
5. Finished or no longer useful? `90 Archive/`.
6. Unclear? Leave it in the Inbox. That is a valid outcome.

Also possible: **merge** a tiny note into an existing one, then delete the empty original with permission; **duplicate**, delete with permission; **nothing**, propose deleting it. Clippings and bare links usually become research notes: keep `source` and the `clipping` tag, reshape the body into the Research template's sections, and keep the original under "Clipped text" at the bottom. Never trim clipped text without a yes.

## 3. Show the plan

One short table: note, destination, new type, a few words of reason. List merges and deletions separately. Wait for a yes unless the arguments say "go"; even then, deletions still need a yes.

## 4. Do it safely

Change properties with your file-editing tools: set `type`, drop `status: inbox` from notes leaving the Inbox, keep `created`. Move notes through Obsidian (the Obsidian CLI, for example `obsidian move path="00 Inbox/X.md" to="30 Research/X.md"`) so links update. Without the CLI, don't move anything: give the owner the list to do in Obsidian. If a moved note belongs to a project, add a sentence about it to the hub's Files section. Afterwards, check for links that now point somewhere odd and for anything new at the root.

## 5. Report

What moved where, as `[[links]]`, and what stayed in the Inbox and why. If this is part of the weekly review, tick "Vault Inbox done, or done enough" only if the owner agrees.
