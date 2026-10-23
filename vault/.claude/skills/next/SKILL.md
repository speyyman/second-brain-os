---
name: next
description: "Pick the one thing to do right now from today's Top 3, what is due, and each project's next action. Read-only."
argument-hint: "[project or energy]"
disable-model-invocation: true
---

# Next

Arguments (optional project name or energy): $ARGUMENTS

Read-only unless the owner asks for a change. Follow AGENTS.md.

1. Read every hub with `type: project` and `status: active` (its `next` and its last few Log lines), today's daily note (unticked Top 3 and `energy`), and anything overdue or due today in the task app, if connected.
2. If a project was named, show its next action, its last three Log lines and the next few steps from its plan notes, then stop.
3. Otherwise recommend one thing to start now. Prefer an unticked item from today's Top 3, then anything overdue or due today, then the project next action that best fits the day's energy; on a low-energy day, the smallest one. Mention the other options in a single line.
4. If the owner says the recommendation is wrong, too big or already done, update the hub's `next` after a yes, as the `project` skill describes.

Keep the reply to a few lines. One clear action matters more than an overview.
