import { attachmentFiles, frontmatter } from './shared.js'
import type { Adapter } from './types.js'

/** A folder of plain Markdown: one file per note, an index, and the attachments they use. */
export const markdownAdapter: Adapter = {
  name: 'markdown',
  htmlCallouts: false,
  noteHref: (slug, anchor) => `${slug}.md${anchor ? `#${anchor}` : ''}`,
  fileHref: (name) => `attachments/${name}`,
  render(pages, ctx) {
    const out = new Map<string, string | Buffer>(attachmentFiles(ctx))
    for (const page of pages) {
      out.set(`${page.slug}.md`, `${frontmatter(page)}\n# ${page.title}\n\n${page.converted.markdown}`)
    }
    const list = pages.map((p) => `- [${p.title}](${p.slug}.md)${p.description ? `: ${p.description}` : ''}`).join('\n')
    out.set('index.md', `# Notes\n\n${list}\n`)
    return { files: out, warnings: [] }
  },
}
