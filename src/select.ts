import { isPublishFalse, isPublishTrue, propertyTags } from './frontmatter.js'
import { splitCode } from './text.js'
import type { Note, Vault } from './vault.js'

export type Selection = {
  /** Require `publish: true` in the note's properties. */
  publishFlag?: boolean
  /** Require the note to be inside this vault folder (and its subfolders). */
  folder?: string
  /** Require this tag, in properties or as an inline #tag. */
  tag?: string
}

export type Selected = {
  notes: Note[]
  /** Notes that matched but say `publish: false`. */
  optedOut: Note[]
  /** Notes whose properties could not be read, so they were left out. */
  unreadable: Note[]
}

export class SelectionError extends Error {}

/** Inline #tags in prose (not in code, not headings), lower case without the `#`. */
export function inlineTags(body: string): string[] {
  const tags = new Set<string>()
  for (const seg of splitCode(body)) {
    if (seg.code) continue
    for (const m of seg.text.matchAll(/(?:^|[\s(])#([\p{L}\p{N}_/-]*[\p{L}_/-][\p{L}\p{N}_/-]*)/gu)) {
      if (m[1]) tags.add(m[1].toLowerCase())
    }
  }
  return [...tags]
}

/**
 * Choose notes to publish. Nothing is chosen by default: at least one rule is required, and a
 * note must pass every rule given. `publish: false` always wins.
 */
export function selectNotes(vault: Vault, sel: Selection): Selected {
  if (!sel.publishFlag && !sel.folder && !sel.tag) {
    throw new SelectionError(
      'Choose what to publish: --publish-flag, --folder <path> or --tag <tag>. Nothing is published by default.',
    )
  }
  const folder = sel.folder
    ?.replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
  const tag = sel.tag?.replace(/^#/, '').toLowerCase()
  const out: Selected = { notes: [], optedOut: [], unreadable: [] }

  for (const note of vault.notes) {
    if (folder && !note.path.toLowerCase().startsWith(`${folder}/`)) continue
    if (note.error) {
      out.unreadable.push(note)
      continue
    }
    if (sel.publishFlag && !isPublishTrue(note.properties.publish)) continue
    if (tag) {
      const tags = [...propertyTags(note.properties), ...inlineTags(note.body)]
      if (!tags.some((t) => t === tag || t.startsWith(`${tag}/`))) continue
    }
    if (isPublishFalse(note.properties.publish)) {
      out.optedOut.push(note)
      continue
    }
    out.notes.push(note)
  }
  return out
}
