---
name: project
description: "Start, update, pause, finish or archive a project, keeping its hub note, single next action, Files section and dated Log correct so Home stays accurate."
argument-hint: "<name and what changed>"
---

# Projects

Arguments: $ARGUMENTS

A project is anything with a finish line that takes more than one sitting. Each one lives in `20 Projects/<Name>/` with a hub note `<Name>.md`. Home's Now view shows every hub with `type: project` and `status: active`, with its `next`. That one line is what the owner actually looks at, so keeping it right matters more than anything else here.

## Hub shape

The Project template: properties `type: project`, `status`, `next`, `tags`, then `## Goal`, `## Why it matters`, `## Next action`, `## Files` and `## Log`.

## Starting a project

1. Create `20 Projects/<Name>/<Name>.md` in that shape with literal dates.
2. Ask at most one question, and only if the goal is truly unknown. Otherwise draft Goal and Why from what the owner said and let them correct it.
3. Write one first `next`.
4. Add `- [ ] [[<Name>]]` to step 3 of `99 System/Templates/Weekly Review.md`.
5. If notes for it already exist, move them into the folder through Obsidian, set `type: project-note` and `project: "[[<Name>]]"`, and describe each in Files.

## A good `next`

Exactly one action, starting with a verb, startable in about ten minutes, specific enough to need no more thought: "Measure the sunny strip by the fence", not "Work on the garden". Never stack several actions into `next`; a longer plan belongs in a plan note. When the current one is done, propose the following one from the project's own plan.

## Progress, pausing, finishing

When something moves, add `**YYYY-MM-DD.** <what happened>.` to the Log, in plain past tense. When a note joins the project, add a sentence about it to Files. Don't rewrite Goal or Why without being asked. Paused: `status: paused`, and it drops off Home. Finished: `status: done` and a final Log line. Archived: move the folder to `90 Archive` through Obsidian and remove it from the Weekly Review template's list.
