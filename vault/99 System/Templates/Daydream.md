<%*
if (tp.file.title.startsWith("Untitled")) {
  const name = await tp.system.prompt("What's this about? (Esc to skip)");
  await tp.file.rename(name ? name : "Capture " + tp.date.now("YYYY-MM-DD HHmm"));
}
-%>
---
created: <% tp.date.now("YYYY-MM-DDTHH:mm") %>
updated: <% tp.date.now("YYYY-MM-DDTHH:mm") %>
type: daydream
status: inbox
spark: false
tags: []
---
<% tp.file.cursor() %>

## Who was in it
*Real people, imagined people, past or future versions of you.*


## What happened
*Tell it the way it played out in your head. It doesn't need to be tidy.*


## What it might be about
*What was underneath it? Does it connect to anything going on right now?*


> [!question] Could this become an idea?
> If it could, tick `spark` above and it will appear under Sparks on [[Home]].
