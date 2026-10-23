import { posix } from 'node:path'
import { headingAnchor, splitCode, stripComments } from './text.js'
import { resolve, type Note, type Target, type Vault } from './vault.js'

/** What a link to a note that is not being published turns into, so its title never leaves the vault. */
export const PRIVATE_LINK_TEXT = 'a private note'

const IMAGE = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i
/** A URL with a scheme (https:, mailto:, data:) or a protocol-relative one: not a vault path. */
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

export type ConvertOptions = {
  vault: Vault
  note: Note
  /** Published notes by vault path, with the slug each one is written under. */
  published: Map<string, string>
  /** Href for a published note (and optional heading anchor) as seen from this note. */
  noteHref: (slug: string, anchor?: string) => string
  /** Href for an attachment copied next to the output, by its vault path. */
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
 * Turn one note's Obsidian Markdown into portable Markdown: comments removed, every kind of
 * link to another vault file (wikilinks, embeds, Markdown links and images, reference
 * definitions, raw HTML href and src) rewritten or made safe, and callouts, highlights and
 * block ids converted. Code is left exactly as written.
 */
export function convert(body: string, o: ConvertOptions): Converted {
  const redactions: Redaction[] = []
  const files = new Set<string>()
  const redact = (target: string, found: Target | undefined) =>
    redactions.push({ target, reason: found ? 'not published' : 'not found' })

  /** Where a vault reference points once published: a page, a copied file, or nowhere. */
  const destination = (found: Target | undefined, anchor?: string): string | undefined => {
    if (found?.kind === 'file') {
      files.add(found.path)
      return o.fileHref(found.path)
    }
    const slug = found ? o.published.get(found.note.path) : undefined
    return slug === undefined ? undefined : o.noteHref(slug, anchor)
  }

  /** A path written in a Markdown or HTML link: relative to this note first, then by name. */
  const resolvePath = (raw: string): { found: Target | undefined; anchor?: string; label: string } => {
    const [pathPart = '', hash] = raw.replace(/^<|>$/g, '').split('#', 2)
    let path = pathPart
    try {
      path = decodeURIComponent(pathPart)
    } catch {
      // A malformed escape: use the text as written.
    }
    const rel = posix.normalize(posix.join(posix.dirname(o.note.path), path))
    const found = resolve(o.vault, rel) ?? resolve(o.vault, path)
    return { found, anchor: hash ? headingAnchor(hash) : undefined, label: posix.basename(path).replace(/\.md$/i, '') }
  }

  const wikilink = (embed: boolean, rawTarget: string, rawHeading: string | undefined, alias: string | undefined) => {
    const heading = rawHeading?.replace(/^#/, '').trim() || undefined
    const anchor = heading && !heading.startsWith('^') ? headingAnchor(heading.split('#').pop() ?? heading) : undefined
    const targetText = rawTarget.trim()

    // [[#Heading]] points into the same note.
    if (!targetText) {
      if (embed || !heading) return ''
      return `[${alias ?? heading}](#${anchor ?? ''})`
    }

    const found = resolve(o.vault, targetText)
    const href = destination(found, anchor)
    if (found?.kind === 'file' && href) {
      const label = alias && !/^\d+(x\d+)?$/.test(alias) ? alias : posix.basename(found.path).replace(/\.[^.]+$/, '')
      return embed && IMAGE.test(found.path) ? `![${label}](${href})` : `[${label}](${href})`
    }
    if (found?.kind === 'note' && href) {
      const title = found.note.name
      return `[${alias ?? (heading ? `${title}: ${heading}` : title)}](${href})`
    }

    // Not published, or not in the vault: keep the sentence readable, drop the title.
    redact(targetText, found)
    if (embed) return ''
    const name = posix.basename(targetText).replace(/\.md$/i, '')
    if (alias && alias.trim().toLowerCase() !== name.toLowerCase()) return alias
    return PRIVATE_LINK_TEXT
  }

  const mdLink = (whole: string, bang: string, text: string, target: string) => {
    if (EXTERNAL.test(target) || target.startsWith('#')) return whole
    const { found, anchor, label } = resolvePath(target)
    const href = destination(found, anchor)
    if (href) return `${bang}[${text}](${href})`
    redact(label, found)
    if (bang) return ''
    return text && text.trim().toLowerCase() !== label.toLowerCase() ? text : PRIVATE_LINK_TEXT
  }

  const prose = (text: string) => {
    // One pass over wikilinks, embeds and inline Markdown links and images, so a link written
    // by one rule is never rewritten by another. Inside a table the wikilink alias pipe is `\|`.
    let t = text.replace(
      /(!?)\[\[([^[\]|#\\]*)(#[^[\]|\\]*)?(?:\\?\|([^[\]]*))?\]\]|(!?)\[([^\]]*)\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g,
      (
        m,
        bang: string | undefined,
        target: string | undefined,
        heading: string | undefined,
        alias: string | undefined,
        mdBang: string | undefined,
        mdText: string | undefined,
        mdTarget: string | undefined,
      ) => {
        if (target !== undefined) return wikilink(bang === '!', target, heading, alias?.trim() || undefined)
        if (mdTarget !== undefined) return mdLink(m, mdBang ?? '', mdText ?? '', mdTarget)
        return m
      },
    )
    // Reference definitions: [id]: path. A private target loses its definition, so the
    // reference shows as plain text and the path goes nowhere.
    // Footnotes ([^1]: text) are not definitions and are left alone.
    t = t.replace(
      /^( {0,3}\[(?!\^)[^\]]+\]:[ \t]*)(<[^>]+>|\S+)(.*)$/gm,
      (m, lead: string, target: string, rest: string) => {
        if (EXTERNAL.test(target) || target.startsWith('#')) return m
        const { found, anchor, label } = resolvePath(target)
        const href = destination(found, anchor)
        if (href) return `${lead}${href}${rest}`
        redact(label, found)
        return ''
      },
    )
    // Raw HTML attributes that point at vault files.
    t = t.replace(
      /\b(href|src)(\s*=\s*)("([^"]*)"|'([^']*)')/gi,
      (m, attr: string, eq: string, _q, dq?: string, sq?: string) => {
        const target = dq ?? sq ?? ''
        if (!target || EXTERNAL.test(target) || target.startsWith('#')) return m
        const { found, anchor, label } = resolvePath(target)
        const href = destination(found, anchor)
        if (href) return `${attr}${eq}"${href}"`
        redact(label, found)
        return `${attr}${eq}""`
      },
    )
    // ==highlight==
    t = t.replace(/==(?=\S)([^=\n]+?)(?<=\S)==/g, '<mark>$1</mark>')
    // Block ids at the end of a line: "some text ^abc123".
    t = t.replace(/[ \t]+\^[A-Za-z0-9-]+[ \t]*$/gm, '')
    t = t.replace(/^\^[A-Za-z0-9-]+[ \t]*$/gm, '')
    return t
  }

  const rewritten = splitCode(stripComments(body))
    .map((s) => (s.code ? s.text : prose(s.text)))
    .join('')
  const markdown = calloutsIn(rewritten, !!o.htmlCallouts)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { markdown: markdown ? markdown + '\n' : '', redactions, files: [...files] }
}

/**
 * Relative links left in converted Markdown that point anywhere other than a published page,
 * a copied attachment or an anchor. The converter should leave none; publish blocks on any.
 */
export function strayLinks(markdown: string, allowed: (href: string) => boolean): string[] {
  const out: string[] = []
  const check = (target: string) => {
    const t = target.replace(/^<|>$/g, '')
    if (t && !EXTERNAL.test(t) && !t.startsWith('#') && !allowed(t)) out.push(t)
  }
  for (const seg of splitCode(markdown)) {
    if (seg.code) continue
    for (const m of seg.text.matchAll(/\]\(\s*(<[^>]+>|[^)\s]+)/g)) check(m[1] ?? '')
    for (const m of seg.text.matchAll(/^ {0,3}\[(?!\^)[^\]]+\]:[ \t]*(<[^>]+>|\S+)/gm)) check(m[1] ?? '')
    for (const m of seg.text.matchAll(/\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) check(m[1] ?? m[2] ?? '')
  }
  return out
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
