import { htmlAdapter } from './html.js'
import { markdownAdapter } from './markdown.js'
import { siteArticles } from './site.js'
import type { Adapter, SiteOptions } from './types.js'

export type Format = 'markdown' | 'html' | 'site'
export const FORMATS: Format[] = ['markdown', 'html', 'site']

/** The adapter for a format. `site` writes speyyman.github.io's article shape as JSON. */
export function adapterFor(format: Format, site: SiteOptions = { base: '/writing/' }): Adapter {
  if (format === 'markdown') return markdownAdapter
  if (format === 'html') return htmlAdapter
  return {
    name: 'site',
    htmlCallouts: false,
    // Converted with Markdown-style links, which siteArticles maps to site paths.
    noteHref: markdownAdapter.noteHref,
    fileHref: markdownAdapter.fileHref,
    render: (pages) => siteArticles(pages, site),
  }
}

export type { Adapter, Page, RenderResult, SiteOptions } from './types.js'
