import { posix } from 'node:path'
import { headingAnchor, splitCode } from './text.js'
import { resolve, type Note, type Vault } from './vault.js'

/** What a link to a note that is not being published turns into, so its title never leaves the vault. */
export const PRIVATE_LINK_TEXT = 'a private note'

const IMAGE = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i

export type ConvertOptions = {
  vault: Vault
  note: Note
  /** Published notes by vault path, with the slug each one is written under. */
  published: Map<string, string>
  /** Href for a published note (and optional heading anchor) as seen from this note. */
  noteHref: (slug: string, anchor?: string) => string
  /** Href for an attachment copied next to the output. */
  fileHref: (path: string) => string
  /** Render callouts as `<aside>` blocks for HTML output instead of plain blockquotes. */
  htmlCallouts?: boolean
}

export type Redaction = { target: string; reason: 'not published' | 'not found' }

export type Converted = {
  markdown: string
  /** Links and embeds that were turned into plain text or removed. */
  redactions: Redaction[]
  /** Attachments the converted note refers to, by vault path. */
  files: string[]
}

/**
 * Turn one note's Obsidian Markdown into portable Markdown: comments removed, wikilinks and
 * embeds rewritten or made safe, callouts, highlights and block ids converted. Code is left
 * exactly as written.
 */
export function convert(body: string, o: ConvertOptions): Converted {
  const redactions: Redaction[] = []
  const files = new Set<string>()

  const link = (embed: boolean, rawTarget: string, rawHeading: string | undefined, alias: string | undefined) => {
    const heading = rawHeading?.replace(/^#/, '').trim() || undefined
    const anchor = heading && !heading.startsWith('^') ? headingAnchor(heading.split('#').pop() ?? heading) : undefined
    const targetText = rawTarget.trim()

    // [[#Heading]] points into the same note.
    if (!targetText) {
      if (embed || !heading) return ''
      return `[${alias ?? heading}](#${anchor ?? ''})`
    }

    const found = resolve(o.vault, targetText)
    const name = posix.basename(targetText).replace(/\.md$/i, '')

    if (found?.kind === 'file') {
      files.add(found.path)
      const href = o.fileHref(found.path)
      const label = alias && !/^\d+(x\d+)?$/.test(alias) ? alias : posix.basename(found.path).replace(/\.[^.]+$/, '')
      return embed && IMAGE.test(found.path) ? `![${label}](${href})` : `[${label}](${href})`
    }

    const slug = found ? o.published.get(found.note.path) : undefined
    if (found && slug !== undefined) {
      const title = found.note.name
      const text = alias ?? (heading ? `${title}: ${heading}` : title)
      return `[${text}](${o.noteHref(slug, anchor)})`
    }

    // Not published, or not in the vault: keep the sentence readable, drop the title.
    redactions.push({ target: targetText, reason: found ? 'not published' : 'not found' })
    if (embed) return ''
    if (alias && alias.trim().toLowerCase() !== name.toLowerCase()) return alias
    return PRIVATE_LINK_TEXT
  }

  const prose = (text: string) => {
    // One pass over both link forms, so a link written by one rule is never rewritten by the other:
    // wikilinks and embeds (inside a table the alias pipe is written `\|`), and standard Markdown
    // links to other notes, e.g. [text](Other%20Note.md#part).
    let t = text.replace(
      /(!?)\[\[([^[\]|#\\]*)(#[^[\]|\\]*)?(?:\\?\|([^[\]]*))?\]\]|(!?)\[([^\]]*)\]\((?![a-z][a-z0-9+.-]*:|#)(<[^>]+>|[^)\s]+?\.md)(#[^)\s]*)?\)/gi,
      (
        m,
        bang: string | undefined,
        target: string | undefined,
        heading: string | undefined,
        alias: string | undefined,
        mdBang: string | undefined,
        mdText: string | undefined,
        mdTarget: string | undefined,
        mdHeading: string | undefined,
      ) => {
        if (target !== undefined) return link(bang === '!', target, heading, alias?.trim() || undefined)
        if (mdTarget === undefined) return m
        const path = decodeURIComponent(mdTarget.replace(/^<|>$/g, ''))
        const rel = posix.normalize(posix.join(posix.dirname(o.note.path), path))
        const direct = o.vault.notes.find((n) => n.path.toLowerCase() === rel.toLowerCase())
        return link(mdBang === '!', direct ? direct.path : path, mdHeading, mdText || undefined)
      },
    )
    // ==highlight==
    t = t.replace(/==(?=\S)([^=\n]+?)(?<=\S)==/g, '<mark>$1</mark>')
    // Block ids at the end of a line: "some text ^abc123".
    t = t.replace(/[ \t]+\^[A-Za-z0-9-]+[ \t]*$/gm, '')
    t = t.replace(/^\^[A-Za-z0-9-]+[ \t]*$/gm, '')
    return t
  }

  const out: string[] = []
  let inComment = false
  for (const seg of splitCode(body)) {
    if (seg.code) {
      if (!inComment) out.push(seg.text)
      continue
    }
    // %% comments %% can span lines; an unclosed one hides the rest of the note, as in Obsidian.
    let kept = ''
    const parts = seg.text.split('%%')
    parts.forEach((part, i) => {
      if (i > 0) inComment = !inComment
      if (!inComment) kept += part
    })
    out.push(prose(kept))
  }

  const markdown = calloutsIn(out.join(''), !!o.htmlCallouts)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { markdown: markdown ? markdown + '\n' : '', redactions, files: [...files] }
}

/** Obsidian callouts (`> [!note] Title`) as a plain blockquote with a bold title, or as an aside for HTML. */
function calloutsIn(text: string, html: boolean): string {
  const lines = text.split('\n')
  const out: string[] = []
  let fence: string | null = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    // Leave fenced code alone: a callout written inside a code block is an example, not a callout.
    const f = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1]
    if (f && fence === null) fence = f
    else if (f && fence !== null && f[0] === fence[0] && f.length >= fence.length) fence = null
    const m = fence === null && !f ? /^>\s*\[!([\w-]+)\]([+-]?)[ \t]*(.*)$/.exec(line) : null
    if (!m) {
      out.push(line)
      continue
    }
    const type = (m[1] ?? 'note').toLowerCase()
    const title = (m[3] ?? '').trim() || type[0]!.toUpperCase() + type.slice(1)
    const inner: string[] = []
    while (i + 1 < lines.length && /^>/.test(lines[i + 1] ?? '')) {
      i++
      inner.push((lines[i] ?? '').replace(/^>\s?/, ''))
    }
    if (html) {
      out.push(
        `<aside class="callout" data-callout="${type}">`,
        `<p class="callout-title">${escapeHtml(title)}</p>`,
        '',
        ...inner,
        '',
        '</aside>',
      )
    } else {
      out.push(`> **${title}**`, ...(inner.length ? ['>', ...inner.map((l) => (l ? `> ${l}` : '>'))] : []))
    }
  }
  return out.join('\n')
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
