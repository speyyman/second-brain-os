---
name: weekly
description: "Run the twenty-minute weekly review step by step, doing the legwork so the owner only decides."
argument-hint: "[step]"
disable-model-invocation: true
---

# Weekly review

Arguments (optional step to start at): $ARGUMENTS

Follow AGENTS.md. Keep the whole thing to about twenty minutes.

1. Open or create this week's review note through Obsidian (the Periodic Notes weekly-note command). Only if Obsidian isn't reachable, write it from `99 System/Templates/Weekly Review.md` with literal values.
2. **Inboxes.** Run the `inbox` skill's workflow for `00 Inbox`. Then, if a task app is connected, go through its undated tasks and propose one outcome for each: do it now, give it a date, make it a project's `next`, merge it, or delete it. Show the list and apply it after a yes. Deleting always needs that yes.
3. **Look back.** Read this week's daily notes and give a short factual summary: what got done, the energy numbers and their average, anything that repeated. The owner writes the reflection; draft it only if asked.
4. **Projects.** For each project in step 3 of the note, show its `next` and recent Log lines, ask what moved, then update `status`, `next` and the Log with the `project` skill.
5. **Sparks.** List notes with `spark: true`, one line each, and let the owner pick one or none.
6. **Top 3.** Write the chosen three into step 5 of the review note.

Tick each step's box only when the owner agrees it's done. If time runs out, stop where you are; part of the review is fine. Missing weeks are normal: don't comment on gaps.
