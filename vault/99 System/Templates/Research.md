<%*
if (tp.file.title.startsWith("Untitled")) {
  const name = await tp.system.prompt("What did you look up? (Esc to skip)");
  await tp.file.rename(name ? name : "Research " + tp.date.now("YYYY-MM-DD HHmm"));
}
-%>
---
created: <% tp.date.now("YYYY-MM-DDTHH:mm") %>
updated: <% tp.date.now("YYYY-MM-DDTHH:mm") %>
type: research
status: inbox
spark: false
source: 
tags: []
---
## What I looked up and why
<% tp.file.cursor() %>

## What I found
*The main points in your own words, as a few short paragraphs. Put the main link in the `source` box above.*


## Sparks
*What ideas did this give you? If any are worth coming back to, tick `spark` above.*


## Related
*Which notes does this connect to? Link them with double brackets.*

