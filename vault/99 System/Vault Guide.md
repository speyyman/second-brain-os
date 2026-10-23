---
created: 2026-10-23T09:00
updated: 2026-10-23T09:00
type: guide
---
# Vault Guide

This is the manual for this vault. Agents read [[AGENTS]] instead; when the two disagree, this guide wins.

## 1. What this vault is for

It is a place to put things down so you can stop carrying them. It is built around three habits, and everything else exists to support them: capture without deciding, sort once a week, and keep one small next step per project. The vault would rather hold a messy note than lose a thought because filing it felt like work.

## 2. The map

| Folder | What goes there |
|---|---|
| `00 Inbox` | Everything new. Unsorted on purpose. |
| `10 Journal` | Daily notes and weekly reviews. |
| `20 Projects` | Anything with a finish line, one folder per project with a hub note of the same name. |
| `30 Research` | Things you looked up: articles, books, videos, topics. |
| `40 Mind` | Things from your own head: daydreams, imagined conversations, reflections. |
| `50 Life` | Ongoing parts of life with no finish line: people, home, money, health, trips. |
| `90 Archive` | Finished or abandoned things, hidden from Home. |
| `99 System` | Templates, attachments, the Home views and this guide. |

When you sort, ask in order and stop at the first yes: does it have a finish line, did I look it up, did it come from my own head, is it an ongoing part of life, is it finished? If nothing fits, it stays in the Inbox. That is allowed.

## 3. Properties

Every note carries a few properties at the top. `created` and `updated` are timestamps. `type` says what kind of note it is (inbox, research, project, project-note, daydream, mind, life, daily, weekly). `status` is `inbox` for new captures and `active`, `paused` or `done` for projects. `spark: true` marks something that might become an idea. A project hub has `next`, its one next action. A daily note has `energy`, a number from 1 to 5 that only you fill in. `publish: true` marks a note you have chosen to share; see section 12.

## 4. Templates

Templates live in `99 System/Templates` and need the Templater plugin: Capture, Daily, Daydream, Project, Research and Weekly Review. Set Templater's folder templates so a new note in `00 Inbox` uses Capture, in `30 Research` uses Research and in `40 Mind` uses Daydream. Set the Periodic Notes plugin to make daily notes in `10 Journal/Daily` from Daily and weekly notes in `10 Journal/Weekly` from Weekly Review.

## 5. Home

[[Home]] is the dashboard. Its views come from `99 System/Home.base` (the core Bases plugin): **Now** lists active projects with their next action, **Inbox** lists what is waiting, **Sparks** lists notes marked as possible ideas, and **Recently touched** shows the last week's notes.

## 6. The daily check-in (5 minutes)

Open today's note. Rate your energy from 1 to 5, write a line about yesterday, and pick a Top 3. On a low-energy day, pick one. Glance at the Inbox count without sorting it. `/today` does the gathering for you and suggests a Top 3.

## 7. The weekly review (20 minutes)

Once a week, with a timer, open the week's review note and work through its five steps: empty the inboxes, look back at the week, update each project's status and next action, look at Sparks, and choose next week's Top 3. Doing part of it is better than skipping it. `/weekly` walks you through it and does the legwork.

## 8. Projects

A project is anything with a finish line that takes more than one sitting. It gets a folder in `20 Projects` and a hub note of the same name, made from the Project template. The hub's `next` holds exactly one action, starting with a verb, small enough to start in ten minutes. Longer plans live in their own notes beside the hub. When something moves, add a dated line to the hub's Log. `/project` and `/win` keep hubs up to date.

## 9. Research and sparks

When you look something up, the Research template asks what you looked up and why, what you found, what ideas it gave you and what it connects to. The first and third sections are yours; an agent drafts only the middle one when asked. If a note feels like the start of an idea, tick `spark`, and it shows on Home until you decide.

## 10. Daydreams and reflections

`40 Mind` is for what comes from inside: scenes you played out, conversations you rehearsed, things you worked out on a walk. The Daydream template asks who was in it, what happened and what it might be about. Nothing here has to be useful.

## 11. Working with agents

Agents follow [[AGENTS]] and the skills in `.claude/skills`. In Claude Code, each skill is a slash command: `/capture`, `/inbox`, `/today`, `/win`, `/next`, `/weekly`, `/research`, `/project`, `/ask`, `/cleanup` and `/vault-check`. Agents propose before they move anything, and they delete nothing without your yes. They never fill in your energy, your reflections or your wins.

## 12. Sharing notes

To share some notes without opening the whole vault, mark each one with `publish: true` and run `vault-publish` from the kit. It exports only notes that match every rule you give it (the `publish` property, a folder, a tag), turns links to unpublished notes into plain text so their titles don't leak, removes Obsidian comments, and refuses to export anything that looks like an email address, phone number, street address, key, token or card number, or any word on your own deny list. Run it with `--dry-run` first to see exactly what would go out.

## 13. The no-guilt rule

If you miss days, or a whole week, don't try to catch up. Start again with today. The vault is meant to hold things for you, not to keep score.
