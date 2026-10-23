---
name: today
description: "Start today's check-in: open today's daily note, gather what is due and each project's next action, and suggest a Top 3."
argument-hint: "[energy 1-5]"
disable-model-invocation: true
---

# Today

Arguments (optional energy number or notes): $ARGUMENTS

Follow AGENTS.md.

1. Find today's local date. If `10 Journal/Daily/YYYY-MM-DD.md` doesn't exist, have Obsidian create it (the Periodic Notes daily-note command). Only if Obsidian isn't reachable, write it yourself from `99 System/Templates/Daily.md` with literal values and no Templater commands.
2. If the owner gave an energy number from 1 to 5, write it into `energy`. Never guess it.
3. Read what is overdue or due today in the task app, if one is connected; if not, say so in one line and carry on. Read the `next` of every hub with `type: project` and `status: active`, step 5 of this week's review note, and yesterday's unticked Top 3.
4. Reply briefly: the Inbox count (don't offer to sort it), what's due, each active project's next action, anything left from yesterday, and a suggested Top 3 drawn from all of these. With energy 1 or 2, suggest one item, not three.
5. Ask once whether to put the suggestion into today's Top 3, and write it only after a yes. Never fill in "Yesterday in a line" or "Wins" for the owner.
