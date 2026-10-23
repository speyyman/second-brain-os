---
name: ask
description: "Answer a question from the vault's own notes, with links to where each point came from. Read-only."
argument-hint: "<question>"
disable-model-invocation: true
---

# Ask the vault

Answer this from the vault: $ARGUMENTS

Read-only. Follow AGENTS.md, especially Privacy.

1. Search note titles, aliases, tags and text for the question's key terms and their synonyms. Skip `.obsidian`, `.git`, `.claude` and `99 System`.
2. Read the notes that matter, not just the matching lines.
3. Answer in plain paragraphs, linking each point to its note as `[[Note]]` or `[[Note#Heading]]`. Keep what the notes say separate from anything you add from general knowledge, and label the latter.
4. If the vault doesn't cover it, say so in one line and offer to research it with the `research` skill.
5. Quote personal notes only as much as the answer needs. Don't write or change anything.
