---
name: win
description: "Log something that got done: add it to today's Wins, update the project hub's Log, and propose the next step."
argument-hint: "<what got done>"
disable-model-invocation: true
---

# Win

Log this win: $ARGUMENTS

Follow AGENTS.md and the `project` skill.

1. If nothing came after the command, ask "What got done?" and nothing else.
2. Add it as a short line under "Wins" in today's daily note, in the owner's words. If today's note doesn't exist, create it first as the `today` skill describes.
3. If it clearly belongs to an active project, add a Log line to that hub: `**YYYY-MM-DD.** <what happened>.`
4. If it completes the hub's current `next`, propose the following action from the project's own plan notes: one concrete step, startable in ten minutes. Update `next` after a yes.
5. If it matches an unticked item in today's Top 3, tick it. If it matches an open task in the task app, complete that task; if several could match, ask which.

Reply in one or two lines: what was logged where, and the proposed next action if there is one.
