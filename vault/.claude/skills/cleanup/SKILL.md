---
name: cleanup
description: "Find and fix strays at the root, duplicates, Untitled or empty notes and broken links, safely and with the owner's yes before anything is deleted."
disable-model-invocation: true
---

# Cleanup

Follow AGENTS.md. Cleanups are where vaults get damaged, so follow these steps in order.

## 1. Inventory

List every note outside `.obsidian`, `.trash`, `.claude` and `.git`, with modification time and size, newest first. Look for `.md` files at the root other than `Home.md`, `AGENTS.md` and `CLAUDE.md`; same-named files in two places; `Untitled` notes and empty files; notes whose body is an unfilled template; and a batch of files with the same timestamp, which usually means a paste or a sync restore.

## 2. Compare, don't guess

For each candidate, find its counterpart by name, then by content: search for a distinctive sentence to catch copies saved under other names. Compare bodies and properties separately, ignoring line-ending differences. An identical body is a true duplicate: keep the copy in the organized folder. Small differences: merge any real content from the stray into the kept note before removing the stray. No counterpart: a new note, filed with the `inbox` skill's questions. Same topic, different content: not duplicates; keep both, name them distinctly and link them.

## 3. Report the plan

Show what is a duplicate of what, what is new and where it goes, and what will be merged. Deleting needs an explicit yes.

## 4. Act safely

1. **Prevent link hijacking first.** `[[Name]]` resolves to the shortest path, so a stray `Name.md` at the root captures links meant for `30 Research/Name.md`. Before moving a duplicate, search for links to it, and rename it with a prefix (`DUP Name.md`) so no live link follows it.
2. File new notes through Obsidian so links update.
3. After a yes, delete through Obsidian (it goes to the system trash), or stage files in `90 Archive/To delete/` and tell the owner.
4. Search the vault for links into `90 Archive/` and restore any that were rewritten by mistake.

## 5. Verify

List the root again, check backlinks on a couple of key notes, and if the vault syncs between devices, sync and list again: some sync tools quietly restore files deleted in large batches, so delete in small batches and recheck. Report what was kept, filed, merged and deleted, with `[[links]]`.
