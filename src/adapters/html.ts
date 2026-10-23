import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Marked } from 'marked'
import { escapeHtml } from '../convert.js'
import { headingAnchor } from '../text.js'
import { attachmentFiles, attachmentName } from './shared.js'
import type { Adapter, Page } from './types.js'

const require = createRequire(import.meta.url)
const themeDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'theme')

/** The self-hosted fonts of the Reading Copy theme (see DESIGN.md), copied next to the pages. */
const FONTS: [pkg: string, file: string][] = [
  ['@fontsource/literata', 'literata-latin-400-normal.woff2'],
  ['@fontsource/literata', 'literata-latin-400-italic.woff2'],
  ['@fontsource/literata', 'literata-latin-600-normal.woff2'],
  ['@fontsource/atkinson-hyperlegible', 'atkinson-hyperlegible-latin-400-normal.woff2'],
  ['@fontsource/atkinson-hyperlegible', 'atkinson-hyperlegible-latin-700-normal.woff2'],
]

function fontFile(pkg: string, file: string): Buffer {
  return readFileSync(join(dirname(require.resolve(`${pkg}/package.json`)), 'files', file))
}

// Headings get the same ids the converter uses for [[Note#Heading]] links.
const marked = new Marked(
  { gfm: true },
  {
    renderer: {
      heading({ tokens, depth, text }) {
        return `<h${depth} id="${headingAnchor(text)}">${this.parser.parseInline(tokens)}</h${depth}>\n`
      },
    },
  },
)

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1))
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function shell(title: string, main: string, description?: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
${description ? `<meta name="description" content="${escapeHtml(description)}">\n` : ''}<link rel="stylesheet" href="style.css">
</head>
<body>
<a class="skip" href="#main">Skip to the text</a>
<header class="masthead"><a href="index.html">Notes</a></header>
<main id="main">
${main}
</main>
<footer class="colophon">Published with vault-publish</footer>
</body>
</html>
`
}

function article(page: Page): string {
  const meta = [
    page.date ? `<time datetime="${page.date}">${formatDate(page.date)}</time>` : '',
    ...page.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`),
  ]
    .filter(Boolean)
    .join(' ')
  const body = marked.parse(page.converted.markdown, { async: false })
  return shell(
    page.title,
    `<article>
<h1>${escapeHtml(page.title)}</h1>
${meta ? `<p class="meta">${meta}</p>\n` : ''}${body}</article>`,
    page.description,
  )
}

/** Static HTML pages in the Reading Copy theme, with an index, the stylesheet and its fonts. */
export const htmlAdapter: Adapter = {
  name: 'html',
  htmlCallouts: true,
  noteHref: (slug, anchor) => `${slug}.html${anchor ? `#${anchor}` : ''}`,
  fileHref: (path) => `attachments/${attachmentName(path)}`,
  render(pages, ctx) {
    const out = new Map<string, string | Buffer>(attachmentFiles(ctx))
    for (const page of pages) out.set(`${page.slug}.html`, article(page))
    const items = pages
      .map(
        (p) =>
          `<li><a href="${p.slug}.html">${escapeHtml(p.title)}</a>${p.date ? ` <time datetime="${p.date}">${formatDate(p.date)}</time>` : ''}</li>`,
      )
      .join('\n')
    out.set('index.html', shell('Notes', `<h1>Notes</h1>\n<ul class="index">\n${items}\n</ul>`))
    out.set('style.css', readFileSync(join(themeDir, 'style.css'), 'utf8'))
    for (const [pkg, file] of FONTS) out.set(`fonts/${file}`, fontFile(pkg, file))
    return { files: out, warnings: [] }
  },
}
