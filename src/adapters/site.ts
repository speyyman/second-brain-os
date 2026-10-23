import { Lexer, type Token, type Tokens } from 'marked'
import type { Page, RenderResult, SiteOptions } from './types.js'

/**
 * The shape of a long-form page on speyyman.github.io (`Article` in the site's src/articles.ts):
 * sections with plain-text paragraphs, an optional quote and buttons for links. Rich Markdown
 * that shape cannot hold (tables, code, images) is left out with a warning, never silently.
 */
export type SiteSection = {
  title: string
  paragraphs?: string[]
  quote?: string
  links?: { label: string; href: string }[]
}

export type SiteArticle = {
  path: string
  kind: 'essay'
  title: string
  eyebrow: string
  lede: string
  description: string
  art: string
  artAlt: string
  date: string
  meta: { k: string; v: string }[]
  sections: SiteSection[]
}

const ARTS = new Set([
  'phyllotaxis',
  'fern',
  'branches',
  'sunburst',
  'sphere',
  'orbits',
  'eye',
  'ridges',
  'medallion',
  'chladni',
  'moon',
])

/** Plain text of inline tokens: link text kept, formatting and tags dropped. */
function plain(tokens: Token[] | undefined): string {
  if (!tokens) return ''
  return tokens
    .map((t) => {
      if (t.type === 'html') return ''
      if (t.type === 'br') return ' '
      if ('tokens' in t && Array.isArray(t.tokens) && t.type !== 'codespan') return plain(t.tokens)
      return 'text' in t ? String(t.text) : ''
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Links inside inline tokens, as buttons: notes on the site get site paths, URLs stay as they are. */
function links(
  tokens: Token[] | undefined,
  hrefFor: (href: string) => string | undefined,
): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = []
  for (const t of tokens ?? []) {
    if (t.type === 'link') {
      const href = hrefFor((t as Tokens.Link).href)
      if (href) out.push({ label: plain((t as Tokens.Link).tokens) || href, href })
    } else if ('tokens' in t && Array.isArray(t.tokens)) out.push(...links(t.tokens, hrefFor))
  }
  return out
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const camel = (slug: string) => slug.replace(/-([a-z0-9])/g, (_m, c: string) => c.toUpperCase())

export function siteArticles(pages: Page[], options: SiteOptions): RenderResult {
  const base = `/${options.base.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/')
  const warnings: string[] = []
  const articles: Record<string, SiteArticle> = {}
  const today = new Date().toISOString().slice(0, 10)

  for (const page of pages) {
    const warn = (what: string) =>
      warnings.push(`${page.note.path}: ${what} left out (the site's page shape has no place for it)`)
    const hrefFor = (href: string) => {
      const m = /^([a-z0-9-]+)\.md(#.*)?$/.exec(href)
      if (m) return `${base}${m[1]}/${m[2] ?? ''}`
      if (/^https?:\/\//.test(href)) return href
      return undefined
    }
    const sections: SiteSection[] = []
    let current: SiteSection = { title: 'Overview' }
    const push = () => {
      if (current.paragraphs?.length || current.quote || current.links?.length) sections.push(current)
    }
    const addLinks = (tokens: Token[] | undefined) => {
      for (const l of links(tokens, hrefFor)) {
        current.links ??= []
        if (!current.links.some((x) => x.href === l.href)) current.links.push(l)
      }
    }
    const para = (text: string) => {
      if (text) (current.paragraphs ??= []).push(text)
    }

    for (const t of new Lexer({ gfm: true }).lex(page.converted.markdown)) {
      if (t.type === 'heading' && (t as Tokens.Heading).depth <= 2) {
        push()
        current = { title: plain((t as Tokens.Heading).tokens) }
      } else if (t.type === 'heading') {
        para(plain((t as Tokens.Heading).tokens))
      } else if (t.type === 'paragraph') {
        para(plain((t as Tokens.Paragraph).tokens))
        addLinks((t as Tokens.Paragraph).tokens)
      } else if (t.type === 'list') {
        for (const item of (t as Tokens.List).items) {
          para(plain(item.tokens))
          addLinks(item.tokens)
        }
      } else if (t.type === 'blockquote') {
        const text = plain((t as Tokens.Blockquote).tokens)
        if (!current.quote) current.quote = text
        else para(text)
      } else if (t.type === 'space' || t.type === 'hr') {
        continue
      } else {
        warn(t.type === 'table' ? 'a table' : t.type === 'code' ? 'a code block' : `a ${t.type} block`)
      }
    }
    push()

    const art =
      typeof page.note.properties.art === 'string' && ARTS.has(page.note.properties.art)
        ? page.note.properties.art
        : 'fern'
    const artAlt = typeof page.note.properties.artAlt === 'string' ? page.note.properties.artAlt : ''
    if (!artAlt)
      warnings.push(`${page.note.path}: no artAlt property; add a description of the plate before using this page`)
    const first = sections[0]?.paragraphs?.[0] ?? ''
    const lede = page.description ?? /^.*?[.!?](?=\s|$)/.exec(first)?.[0] ?? first
    const date = page.date ?? today

    articles[camel(page.slug)] = {
      path: `${base}${page.slug}/`,
      kind: 'essay',
      title: page.title,
      eyebrow: typeof page.note.properties.eyebrow === 'string' ? page.note.properties.eyebrow : 'Notes',
      lede,
      description: page.description ?? lede,
      art,
      artAlt,
      date,
      meta: [{ k: 'Date', v: formatDate(date) }],
      sections,
    }
  }
  return { files: new Map([['articles.json', JSON.stringify(articles, null, 2) + '\n']]), warnings }
}
