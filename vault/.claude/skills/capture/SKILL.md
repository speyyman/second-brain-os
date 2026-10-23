---
name: capture
description: "Save something new into the vault without sorting it: a thought, a link, an article, a pasted conversation or an image. Use when the owner says capture, save this, remember this, or pastes material to keep."
argument-hint: "<text or link>"
---

# Capture

Capture this: $ARGUMENTS

Follow AGENTS.md, including its Privacy section. The rule of the vault is to capture anywhere and sort once a week, so never make the owner decide a category now.

1. If nothing came after the command, ask one question only: "What should I capture?"
2. Search the vault for a note on the same thing (title words and a distinctive phrase). If one exists, add to it instead of creating a duplicate.
3. Otherwise create `00 Inbox/<short title>.md`. Use the owner's own wording for the title and the text, and avoid characters that are invalid in file names. Write literal values, because Templater doesn't run when you write files directly:

   ```yaml
   ---
   created: <local time, YYYY-MM-DDTHH:mm>
   updated: <same>
   type: inbox
   status: inbox
   spark: false
   tags: []
   ---
   ```

4. A link: drop tracking parameters (`utm_*`, `fbclid`, `si` and the like) but keep the parts that identify the content. Put it in `source`, with a sentence on why it mattered if the owner gave one.
5. A whole article the owner wants kept: name the note after the article, put the URL in `source`, add `tags: [clipping]`, and write the body as "Clipped from <site> on <date>", then `## Why I saved this` (left for the owner) and `## Clipped text`. If the page can't be fetched, save the link and say so plainly.
6. An image: save it to `99 System/Attachments` under a short descriptive name, embed it with `![[file]]`, and add a line on what it shows. Don't transcribe other people's names, numbers or addresses visible in it.
7. A to-do that needs a reminder or a date belongs in the task app, not the vault (see "Tasks and reminders" in AGENTS.md). A step of an active project becomes that project's `next` or a line in its plan.
8. Don't categorize, don't polish the text, and don't tick `spark` unless asked.

Reply with one line saying where it went, as a `[[link]]`.
