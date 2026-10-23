import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stringify } from 'yaml'
import type { Page, WriteContext } from './types.js'

/** Copy the referenced attachments under `attachments/`, each under the name publish gave it. */
export function attachmentFiles(ctx: WriteContext): Map<string, Buffer> {
  const out = new Map<string, Buffer>()
  for (const f of ctx.files) out.set(`attachments/${f.name}`, readFileSync(join(ctx.vaultRoot, f.path)))
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
