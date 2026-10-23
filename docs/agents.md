# How the agents work

The agents in this kit are not background processes. Nothing runs on its own, watches the vault, or edits notes while you sleep. Each one is a skill: a Markdown file of instructions in `vault/.claude/skills/<name>/SKILL.md` that an agent follows when you ask, by typing its name as a command. That choice is deliberate. An agent that acts only when called, says what it changed and asks before anything irreversible is one you can trust with your notes.

## Three layers

1. **`CLAUDE.md`** is what Claude Code reads first. It is short: it imports `AGENTS.md` and repeats the privacy rules in brief, so they apply even in tools that copy only this one file into a session.
2. **`AGENTS.md`** is the standing guide for every agent: who it is helping and how, the privacy rules, the writing style, the folder map and the order of questions that decides where a note goes, the properties every note carries, and the rules for changing files safely. Every skill says "follow AGENTS.md" first, so these rules are written once.
3. **Skills** hold one workflow each. In Claude Code they are slash commands; any other agent is told in `AGENTS.md` to treat a message starting with a skill's name as a request to open that file and follow it.

`99 System/Vault Guide.md` is the same system written for the person rather than the agent. When the two disagree, the guide wins, and the agent is told to say so.

## The skills

| Command        | Changes notes? | What it does                                                                                                                                                                       |
| -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/capture`     | yes            | Saves something to `00 Inbox` as written, after checking for a note on the same thing. Never asks where it should go.                                                              |
| `/inbox`       | after a yes    | Reads every Inbox note in full, proposes a destination for each in one table, then moves them through Obsidian so links update. Deleting always needs its own yes.                 |
| `/today`       | after a yes    | Gathers each active project's next action, what is due, and yesterday's leftovers, and suggests a Top 3 (one on a low-energy day). Never fills in your energy or your reflections. |
| `/win`         | yes            | Logs a win in today's note and the project's Log, and proposes the next action when the current one is done.                                                                       |
| `/next`        | no             | Recommends one thing to start now.                                                                                                                                                 |
| `/weekly`      | after a yes    | Walks the five-step, twenty-minute review: inboxes, a factual look back, projects, sparks, next week's Top 3. Stops where you stop.                                                |
| `/research`    | yes            | Turns a link, clipping or topic into a research note, separating what a source claims from what is established. Leaves your own sections for you.                                  |
| `/project`     | yes            | Starts, updates, pauses or finishes a project hub, keeping exactly one `next` action.                                                                                              |
| `/ask`         | no             | Answers from the vault's notes, linking each point to its source note.                                                                                                             |
| `/cleanup`     | after a yes    | Finds strays, duplicates and broken links, compares before judging, and guards against link hijacking when files share a name.                                                     |
| `/vault-check` | no             | A read-only health report: "Fine", "Worth fixing", "Needs your decision".                                                                                                          |

## Rules that make them safe

- **Propose, then act.** Sorting, cleanup and anything that moves files shows a plan first. Deletion always needs an explicit yes, even when you said "just do it".
- **Moves go through Obsidian.** Moving a file behind Obsidian's back breaks links and can fight with sync, so skills move and rename through the Obsidian CLI, or hand you a list to do yourself.
- **Your words stay yours.** Agents capture text as you wrote it, never invent your energy number, your feelings or your wins, and leave the "why" and "sparks" sections of research notes for you.
- **One next action.** Every active project shows exactly one next step on Home, small enough to start in ten minutes. Most of the system's usefulness comes from that one line being right.
- **No guilt.** Missed days and weeks are normal. Agents don't comment on gaps; you start again with today.
- **Privacy first.** Agents don't copy note contents into other apps, web searches or published pages unless you ask, and never store personal details in an assistant's memory. Sharing goes through `vault-publish`, which checks before anything leaves. See [privacy-model.md](privacy-model.md).
