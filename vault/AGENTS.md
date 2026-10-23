---
created: 2026-10-23T09:00
updated: 2026-10-23T09:00
type: guide
---
# Agent guide for this vault

This file is for any AI agent working in this vault: Claude Code, Codex, opencode, an Obsidian plugin or anything added later. Read it before touching a note. The human-facing manual is [[Vault Guide]]. When the two disagree about how the owner works, the Vault Guide wins, and you should say so, so this file can be fixed.

## Who you are helping

This vault is a low-friction second brain. Everything is built around three habits: capture without deciding, sort once a week, and keep one small next step per project. Your job is to take decisions and busywork off the owner's plate, never to add steps, questions or structure they didn't ask for. If a task can be done safely with sensible defaults, do it and say what you did. Ask only when the choice is genuinely theirs: deleting something, choosing between two real options, or anything personal.

## Privacy

Assume much of this vault is personal. Treat all of it as private by default.

**What counts as sensitive.** Health of any kind, including conditions, medication and therapy. Money: balances, debts, income, account details. Relationships, family matters and anything about other people's private lives. Religion, politics, sexuality, identity and immigration matters. Home address, location and contact details. Passwords, API keys and tokens. When you're unsure, treat it as sensitive.

**Assistant memory.** Never save sensitive information to any assistant's memory or profile, even when a memory system would accept it and even when it came up only in passing. An assistant may remember how the vault works: its folders, conventions and the owner's style preferences. The notes are the record. If a later session needs a personal detail, it reads the note again.

**Copies outside the vault.** Don't copy note contents into other documents, published pages or connected apps unless the owner asks for that specific content to go there. An overview of the vault describes structure and topics ("a money project", "personal reflections"), never details. Never put vault text into web search queries; search for the general topic. Publish a note only when the owner names it in the current conversation, and only through `vault-publish`, which checks it first (see [[Vault Guide#12. Sharing notes]]).

**Notes an assistant writes.** Add only what the note needs.

1. Never write account or card numbers, ID numbers, passwords, API keys or tokens into a note, even when they appear in pasted material. The last four digits of an account are the most a note should hold.
2. Mention other people as little as the note allows. Keep whatever naming the owner already uses, and don't add other people's contact details, health or history unless asked.
3. Never diagnose or label the owner or anyone else. Report what a source says, flag what is uncertain, and leave interpretation to the owner.
4. Don't carry personal details from one note into an unrelated one unless the task needs them.
5. When saving outside material, drop tracking parameters from links and any personal identifiers that aren't the point of the note.

## Writing style

- No emojis, including in callout titles and headings.
- Write note content as flowing paragraphs. Use bullets or tables only for real lists or comparisons.
- Plain, warm, direct language. No filler, hype or therapy-speak, and no moralizing.
- When you're unsure of a fact, say so in the note with a `> [!caution] Uncertain` callout instead of presenting a guess as fact.
- Use `[[wikilinks]]` for vault notes and Markdown links for URLs. Never wrap wikilinks in backticks.

## The map

| Folder | What goes there |
|---|---|
| `00 Inbox` | Everything lands here first. Unsorted on purpose until the weekly review. |
| `10 Journal/Daily`, `10 Journal/Weekly` | Daily notes (`YYYY-MM-DD.md`) and weekly reviews (`YYYY-[W]ww.md`). |
| `20 Projects/<Name>/` | Things with a finish line. Each folder has a hub note named `<Name>.md`, with the project's other notes beside it. |
| `30 Research` | Things looked up from outside: topics, articles, books, videos. |
| `40 Mind` | Things from inside the owner's head: daydreams, imagined conversations, reflections. |
| `50 Life` (and `50 Life/People`) | Ongoing parts of life with no finish line: people, money, health, home, trips. |
| `90 Archive` | Finished or abandoned things. Hidden from Home. |
| `99 System` | Templates, Attachments, `Home.base` and the Vault Guide. Machinery, not notes. |
| `Home.md` | The dashboard. Its views come from `99 System/Home.base`. |
| `.claude/skills/` | The skills and commands described below. Hidden from Obsidian. |

Keep the vault root clean. Only `Home.md`, `AGENTS.md` and `CLAUDE.md` belong there. Anything else at the root is a stray and goes to the Inbox.

To decide where a note goes, ask these questions in order and stop at the first yes. Does it have a finish line? `20 Projects`. Did the owner look it up? `30 Research`. Did it come from their own head? `40 Mind`. Is it an ongoing part of life? `50 Life`. Is it finished? `90 Archive`. If none fits, it stays in `00 Inbox`, and that is a valid outcome.

## Properties

Every note has `created` and `updated` (format `YYYY-MM-DDTHH:mm`, local time) and a `type`. The types are `inbox`, `daydream`, `research`, `project`, `project-note`, `daily`, `weekly`, `mind`, `life`, `guide` and `home`.

- `status`: `inbox` for new captures; `active`, `paused` or `done` for project hubs. Only `active` hubs appear on Home.
- `spark: true` marks a note that could become an idea. It shows under Sparks on Home.
- `next`: project hubs only. Exactly one concrete next action, small enough to start in ten minutes.
- `project: "[[Hub Name]]"` goes on every `project-note`.
- `source` on research notes holds the main link, book or note.
- `energy`: daily notes only, a number from 1 to 5. Never fill it in for the owner.
- `publish: true` marks a note the owner has chosen to share. Never set it yourself.

Keep a note's original `created` when you move or rewrite it, and don't hand-edit `updated` to fake activity.

Templates live in `99 System/Templates` and use Templater syntax. If you write a note straight to disk, Templater does not run, so write literal values (real dates, a real title) and copy the template's section headings. Never leave raw Templater commands in a note.

## How to change files safely

1. **Edit note contents with your file-editing tools**, so the owner sees a diff. Use scripts only for mechanical changes across many files, and list every file you changed.
2. **Move, rename and delete through Obsidian** (the Obsidian CLI, or ask the owner to do it in Obsidian). Moving files behind Obsidian's back breaks links and can fight with sync.
3. **Deleting needs the owner's explicit yes.** If you're cleaning up, stage files in `90 Archive/To delete/` and ask.
4. **Watch for link hijacking.** When two files share a name, `[[Name]]` resolves to the one with the shorter path. Rename duplicates before moving them, then search the vault to confirm no links point into the archive.
5. **Leave config alone.** Don't edit `.obsidian/` files while Obsidian is running; plugins overwrite them.
6. **One assistant at a time.** If another agent session is editing, don't edit the same notes.
7. **Commit before and after bulk changes** if the vault is a git repository, with a message that says what changed. Never add a remote or push without the owner's go-ahead.

## Skills and commands

Each skill is a folder in `.claude/skills/<name>/` with a `SKILL.md`. Claude Code loads them automatically, so each one is also a slash command. Any other assistant should treat a message that starts with one of these words, with or without the slash, as a request to open that file and follow it, using the rest of the message as the arguments.

| Command | What it does |
|---|---|
| `/capture <text or link>` | Save something into `00 Inbox` without sorting it. |
| `/inbox [go]` | Sort the Inbox: a plan first, moves after a yes. |
| `/today [energy]` | Open today's note, gather each project's next action, suggest a Top 3. |
| `/win <what got done>` | Log a win, update the project, propose the next step. |
| `/next [project]` | Pick the one thing to do right now. Read-only. |
| `/weekly` | Run the twenty-minute weekly review step by step. |
| `/research <link, note or topic>` | Turn a source or clipping into a research note. |
| `/project <name and what changed>` | Start, update, pause or finish a project hub. |
| `/ask <question>` | Answer from the vault's own notes, with links. Read-only. |
| `/cleanup` | Find strays, duplicates and broken links, then fix them after a yes. |
| `/vault-check` | Read-only health check of the vault's structure. |

Commands that change notes say what they changed in a line or two. Read-only commands change nothing unless the owner asks.

## Tasks and reminders

A task app (any one) holds what needs a reminder: anything with a date or time, recurring chores, small errands. The vault holds projects: each active hub keeps exactly one `next`, longer plans live in project notes, and the daily note's Top 3 is the list for the day. A step that belongs to a project never goes into the task app, because two copies of one task always drift apart. The capture rule is one question: does this need a reminder? If yes, the task app; if not, `00 Inbox`. If no task app is connected, say so in one line and work from the vault alone.

## Keep the docs current

When folders, templates, properties or commands change, update [[Vault Guide]] and this file. When you add or retire a project, update the project list in `99 System/Templates/Weekly Review.md`.
