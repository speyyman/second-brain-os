<%*
if (tp.file.title.startsWith("Untitled")) {
  const name = await tp.system.prompt("Project name?");
  if (name) await tp.file.rename(name);
}
-%>
---
created: <% tp.date.now("YYYY-MM-DDTHH:mm") %>
updated: <% tp.date.now("YYYY-MM-DDTHH:mm") %>
type: project
status: active
next: 
tags: []
---
## Goal
*What does "done" look like?*
<% tp.file.cursor() %>

## Why it matters


## Next action
*Keep exactly one next action in the `next` box above so it shows on [[Home]]. Use this space to think through anything that's blocking it.*


## Files
*A sentence on each note in this project's folder and what it is for.*


## Log
*Add a dated line whenever something moves forward.*

**<% tp.date.now("YYYY-MM-DD") %>.** Started.
