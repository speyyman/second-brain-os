---
publish: true
created: 2026-10-01T09:00
tags: [share, garden]
description: The hub of the fixture.
status: active
next: Something private-ish that must not be exported as a property
---
Intro paragraph linking [[Child|the child note]] and [[Child]] and [[Nested/Deep/Child#Part two]].

An aliased private link: [[Secret plans|our plans]]. An unaliased one: [[Secret plans]]. An alias that is just the title: [[Secret plans|secret plans]].

A missing note: [[Nowhere at all]]. Same-note heading: [[#Second section|jump down]].

Embeds: ![[Secret plans]] then ![[Nested/Deep/Child]] then ![[diagram.png|300]].

Markdown link to a note: [see child](Nested/Deep/Child.md) and to a private one: [hidden](../Private/Secret%20plans.md).

Inline code keeps `[[Secret plans]]` and `%% not a comment %%` as written.

```md
Fenced code keeps [[Secret plans]] and ==this== exactly.
```

%% A private comment
that spans two lines with [[Secret plans]] inside. %%

This is ==highlighted== text with a block id. ^abc123

> [!caution] Uncertain
> A callout with `inline code` and a [[Child]] link.

| Item | Link |
|---|---|
| Row | [[Child\|child in a table]] |

## Second section

Tags inline: #share and #share/sub.
