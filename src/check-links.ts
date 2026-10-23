import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { headingAnchor, splitCode } from './text.js'
import { resolve, type Vault } from './vault.js'

export type BrokenLink = { from: string; link: string; problem: string }

/**
 * Check that every wikilink and embed in a vault resolves: the note or file exists, a
 * `#Heading` exists in its target, and a `Home.base#View` names a real view. Templates are
 * skipped, since their links are filled in when a note is made from them.
 */
export function checkLinks(
  vault: Vault,
  skip: (path: string) => boolean = (p) => p.startsWith('99 System/Templates/'),
): BrokenLink[] {
  const broken: BrokenLink[] = []
  const headings = (body: string) =>
    new Set(
      splitCode(body)
        .filter((s) => !s.code)
        .flatMap((s) => [...s.text.matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)].map((m) => headingAnchor(m[1] ?? ''))),
    )
  for (const note of vault.notes) {
    if (skip(note.path)) continue
    for (const seg of splitCode(note.body)) {
      if (seg.code) continue
      for (const m of seg.text.matchAll(/!?\[\[([^[\]|#\\]*)(#[^[\]|\\]*)?(?:\\?\|[^[\]]*)?\]\]/g)) {
        const target = (m[1] ?? '').trim()
        const heading = m[2]?.slice(1).trim()
        const link = m[0]
        if (!target) {
          if (heading && !headings(note.body).has(headingAnchor(heading)))
            broken.push({ from: note.path, link, problem: 'heading not found' })
          continue
        }
        const found = resolve(vault, target)
        if (!found) {
          broken.push({ from: note.path, link, problem: 'no such note or file' })
          continue
        }
        if (!heading || heading.startsWith('^')) continue
        if (found.kind === 'note' && !headings(found.note.body).has(headingAnchor(heading))) {
          broken.push({ from: note.path, link, problem: 'heading not found' })
        }
        if (found.kind === 'file' && found.path.endsWith('.base')) {
          const base = parse(readFileSync(join(vault.root, found.path), 'utf8')) as { views?: { name?: string }[] }
          if (!base.views?.some((v) => v.name === heading))
            broken.push({ from: note.path, link, problem: 'no view with that name' })
        }
      }
    }
  }
  return broken
}
