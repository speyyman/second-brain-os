<%*
if (tp.file.title.startsWith("Untitled")) {
  const name = await tp.system.prompt("What's this about? (Esc to skip)");
  await tp.file.rename(name ? name : "Capture " + tp.date.now("YYYY-MM-DD HHmm"));
}
-%>
---
created: <% tp.date.now("YYYY-MM-DDTHH:mm") %>
updated: <% tp.date.now("YYYY-MM-DDTHH:mm") %>
type: inbox
status: inbox
spark: false
tags: []
---
<% tp.file.cursor() %>
