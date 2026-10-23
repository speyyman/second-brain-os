import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve as resolvePath } from 'node:path'
import { stringify } from 'yaml'
import { adapterFor, type Format, type Page, type SiteOptions } from './adapters/index.js'
import { publicProperties } from './adapters/shared.js'
import { convert, type Redaction } from './convert.js'
import { propertyDate, propertyTags } from './frontmatter.js'
import { scan, type Finding, type PrivacyOptions } from './privacy.js'
import { selectNotes, type Selection } from './select.js'
import { slugify } from './text.js'
import { readVault, type Vault } from './vault.js'

/** Written into every output folder, so a later run knows the folder is safe to replace. */
export const MARKER = '.vault-publish'

export type PublishOptions = {
  vault: string | Vault
  selection: Selection
  format: Format
  /** Output folder. Not needed for a dry run. */
  out?: string
  dryRun?: boolean
  privacy?: PrivacyOptions
  site?: SiteOptions
}

export type PublishReport = {
  /** True when nothing was blocked; files were written unless this was a dry run. */
  ok: boolean
  pages: { path: string; slug: string; redactions: Redaction[] }[]
  optedOut: string[]
  unreadable: { path: string; error: string }[]
  /** Privacy findings. Any finding blocks the export. */
  findings: Finding[]
  /** Attachments the pages use (images are not scanned, so they are listed for a look). */
  files: string[]
  warnings: string[]
  /** Files written, relative to the output folder. Empty on a dry run or when blocked. */
  written: string[]
}

export class OutputError extends Error {}

export function publish(o: PublishOptions): PublishReport {
  const vault = typeof o.vault === 'string' ? readVault(o.vault) : o.vault
  const chosen = selectNotes(vault, o.selection)
  const adapter = adapterFor(o.format, o.site)

  // Stable, unique slugs, assigned in path order.
  const published = new Map<string, string>()
  const used = new Set<string>()
  for (const note of chosen.notes) {
    const base = slugify(note.name)
    let slug = base
    for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`
    used.add(slug)
    published.set(note.path, slug)
  }

  const pages: Page[] = chosen.notes.map((note) => {
    const description = typeof note.properties.description === 'string' ? note.properties.description : undefined
    return {
      note,
      slug: published.get(note.path) ?? 'note',
      title: note.name,
      date: propertyDate(note.properties),
      tags: propertyTags(note.properties),
      description,
      converted: convert(note.body, {
        vault,
        note,
        published,
        noteHref: adapter.noteHref,
        fileHref: adapter.fileHref,
        htmlCallouts: adapter.htmlCallouts,
      }),
    }
  })

  // Scan exactly what would leave the vault: the public properties and the converted text.
  // The site format also carries the eyebrow and plate description, so those are scanned too.
  const extra = (p: Page) =>
    ['eyebrow', 'artAlt']
      .map((k) => p.note.properties[k])
      .filter((v): v is string => typeof v === 'string')
      .join('\n')
  const findings = pages.flatMap((p) =>
    scan(`${stringify(publicProperties(p))}\n${p.converted.markdown}\n${extra(p)}`, p.note.path, o.privacy),
  )
  const files = [...new Set(pages.flatMap((p) => p.converted.files))].sort()
  const rendered = adapter.render(pages, { vaultRoot: vault.root, files })

  const report: PublishReport = {
    ok: findings.length === 0,
    pages: pages.map((p) => ({ path: p.note.path, slug: p.slug, redactions: p.converted.redactions })),
    optedOut: chosen.optedOut.map((n) => n.path),
    unreadable: chosen.unreadable.map((n) => ({ path: n.path, error: n.error ?? '' })),
    findings,
    files,
    warnings: rendered.warnings,
    written: [],
  }
  if (!report.ok || o.dryRun) return report
  if (!o.out) throw new OutputError('An output folder is needed: --out <folder>.')

  prepareOut(o.out, vault.root)
  for (const [rel, data] of rendered.files) {
    const path = join(o.out, rel)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, data)
    report.written.push(rel)
  }
  writeFileSync(join(o.out, MARKER), 'Written by vault-publish. The next run replaces this folder.\n')
  report.written.sort()
  return report
}

/**
 * Make the output folder ready: refuse a folder inside the vault, and refuse to empty a folder
 * that has files in it unless vault-publish wrote it.
 */
function prepareOut(out: string, vaultRoot: string) {
  const outAbs = resolvePath(out)
  const rel = relative(resolvePath(vaultRoot), outAbs)
  if (!rel || (!rel.startsWith('..') && !rel.includes(':'))) {
    throw new OutputError('The output folder must be outside the vault.')
  }
  if (existsSync(outAbs)) {
    const entries = readdirSync(outAbs)
    if (entries.length && !entries.includes(MARKER)) {
      throw new OutputError(`${out} already has files that vault-publish did not write. Choose an empty or new folder.`)
    }
    for (const e of entries) rmSync(join(outAbs, e), { recursive: true, force: true })
  }
  mkdirSync(outAbs, { recursive: true })
}
