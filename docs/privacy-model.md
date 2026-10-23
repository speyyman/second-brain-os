# The privacy model

A second brain is useful because you put everything in it. That is also why it is dangerous to share. This kit assumes the whole vault is private and treats every route out of it as something to guard.

## What counts as private

By default, everything. `AGENTS.md` names the categories agents must treat with most care: health, money, relationships and other people's lives, religion, politics, sexuality, identity and immigration matters, home address and contact details, and passwords and keys. When an agent is unsure, it treats the thing as private.

## The routes out, and the rule for each

| Route                    | Rule                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assistant memory         | Agents may remember how the vault works (folders, conventions, style). Never what the notes say about you or anyone else. A later session re-reads the note instead.      |
| Web searches             | Agents search for the general topic, never with vault text in the query.                                                                                                  |
| Other apps and documents | Note contents are copied out only when you ask for that specific content to go there. An overview describes structure ("a money project"), not details.                   |
| Notes agents write       | Only what the note needs: no account numbers, keys or ID numbers even if they were pasted in, other people mentioned as little as possible, nobody diagnosed or labelled. |
| Publishing               | Only through `vault-publish`, only notes you chose, and only after the check below passes.                                                                                |

## How vault-publish enforces it

**Consent is explicit and narrow.** Nothing is published by default. You give rules (`--publish-flag`, `--folder`, `--tag`) and a note must pass all of them. `publish: true` counts as consent; `yes`, `1` or a typo does not. `publish: false` overrides every rule. A note whose properties can't be read is left out and reported, never guessed at.

**Links don't leak.** A link from a shared note to an unshared one is the most common way a title escapes: "see [[Letters I never sent]]". The converter turns such links into their alias, or into "a private note" when there is no alias or the alias just repeats the title. Embeds of unshared notes are removed outright. Links to notes that don't exist are treated the same way, since the title is still yours.

**Hidden text stays hidden.** Obsidian comments (`%% ... %%`) are removed, and an unclosed comment hides the rest of the note, as it does in Obsidian. Only four properties leave the vault: title, date, tags and description.

**The check reads what would leave.** The scan runs on the converted output, not the source, so it sees exactly what a reader would: every page's text, code blocks included (that is where keys get pasted), plus the exported properties. It looks for email addresses, phone numbers, street addresses and PO boxes, card numbers that pass the Luhn check, `123-45-6789` style ID numbers, private-key blocks, common API key and token formats (AWS, Google, OpenAI and Anthropic style `sk-` keys, Stripe, GitHub, Slack, npm, JWTs) and `password = ...` assignments, plus your own deny list of names, places and project words.

**One finding blocks everything.** If anything is found, nothing is written. The report lists each finding as `file:line:column`, its kind, and the match with its middle masked, so the report itself is safe to paste into an issue. You fix the note, or put an exact string you mean to publish (your public email, say) on an allow list.

**Output can't clobber.** The tool refuses an output folder inside the vault, and refuses to empty a folder it did not write. It marks its own output so the next run can replace it.

## What it cannot do

Pattern matching finds the shapes of secrets, not their meaning. It will not notice a sentence about someone's health, a first name it has never been told about, or a photo of a letter. Attachments are copied, not scanned; the report lists them so you can look. Address and phone patterns are tuned for US and UK formats. The deny list is how you teach it your own names and places, and `--dry-run` is how you read what would go out before it does. The tool is a seatbelt, not a substitute for reading.
