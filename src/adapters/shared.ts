import { readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import { stringify } from 'yaml'
import { slugify } from '../text.js'
import type { Page, WriteContext } from './types.js'

/** A flat, collision-free name for an attachment: its vault path slugged, extension kept. */
export function attachmentName(path: string): string {
  const ext = posix.extname(path).toLowerCase()
  return `${slugify(path.slice(0, path.length - ext.length))}${ext}`
}

/** Copy the referenced attachments under `attachments/`. */
export function attachmentFiles(ctx: WriteContext): Map<string, Buffer> {
  const out = new Map<string, Buffer>()
  for (const f of ctx.files) out.set(`attachments/${attachmentName(f)}`, readFileSync(join(ctx.vaultRoot, f)))
  return out
}

/**
 * The only properties that leave the vault: title, date, tags and description. Everything else
 * (status, project links, energy, private fields) stays behind.
 */
export function publicProperties(page: Page): Record<string, unknown> {
  const p: Record<string, unknown> = { title: page.title }
  if (page.date) p.date = page.date
  if (page.tags.length) p.tags = page.tags
  if (page.description) p.description = page.description
  return p
}

export function frontmatter(page: Page): string {
  return `---\n${stringify(publicProperties(page)).trimEnd()}\n---\n`
}
