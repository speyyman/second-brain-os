---
name: vault-check
description: "Read-only health check of the vault: strays, leftover template code, missing properties, links into the archive, Home views and backups. Changes nothing."
disable-model-invocation: true
---

# Vault check

Run a health check and report. Change nothing until the owner says yes. Fixes afterwards go through the `cleanup` skill.

Check each of these and note only what's wrong:

1. **Root:** anything besides `Home.md`, `AGENTS.md`, `CLAUDE.md` and dot folders.
2. **Inbox:** how many notes, and the oldest one's date. Information only.
3. **Notes:** raw Templater commands (an opening angle bracket followed by a percent sign) anywhere outside `99 System/Templates`; `Untitled` or empty notes; notes missing `type` or `created`; same-named notes in two folders.
4. **Projects:** hubs with `status: active` and an empty or multi-step `next`.
5. **Links:** links that point into `90 Archive` or to a stray copy, and links to notes that don't exist.
6. **Home:** `99 System/Home.base` still has the views Now, Inbox, Sparks and Recently touched.
7. **Backups:** if the vault is a git repository, when the last commit was made and whether anything big is uncommitted.

Report as a short list grouped into "Fine", "Worth fixing" and "Needs your decision", with a proposed fix for each problem. Ask before fixing anything.
