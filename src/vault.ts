import { readdirSync, readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import { parseNote, type Properties } from './frontmatter.js'

export type Note = {
  /** Path inside the vault with forward slashes, e.g. `20 Projects/Raised Bed/Raised Bed.md`. */
  path: string
  /** File name without `.md`: the title Obsidian shows and links by. */
  name: string
  properties: Properties
  body: string
  error?: string
}

export type Vault = {
  root: string
  notes: Note[]
  /** Every other file (images, PDFs), by vault path. */
  files: string[]
}

/** Read every note and file in a vault, skipping dot folders such as `.obsidian`, `.git` and `.claude`. */
export function readVault(root: string): Vault {
  const notes: Note[] = []
  const files: string[] = []
  const walk = (rel: string) => {
    for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const path = rel ? posix.join(rel, entry.name) : entry.name
      if (entry.isDirectory()) walk(path)
      else if (entry.name.toLowerCase().endsWith('.md')) {
        const parsed = parseNote(readFileSync(join(root, path), 'utf8'))
        notes.push({ path, name: entry.name.slice(0, -3), ...parsed })
      } else files.push(path)
    }
  }
  walk('')
  notes.sort((a, b) => a.path.localeCompare(b.path))
  files.sort()
  return { root, notes, files }
}

export type Target = { kind: 'note'; note: Note } | { kind: 'file'; path: string }

/**
 * Resolve a link target the way Obsidian does: an exact vault path first, then by file name,
 * and when several files share a name, the one with the shortest path wins.
 */
export function resolve(vault: Vault, target: string): Target | undefined {
  const t = target.trim().replace(/\\/g, '/').replace(/^\//, '')
  if (!t) return undefined
  const lower = t.toLowerCase()

  // A file whose name matches exactly wins (`[[diagram.png]]`). Otherwise try a note, so a
  // note with a dot in its name (`[[Version 2.0]]`) is not mistaken for a file.
  const file = () => {
    const byPath = vault.files.find((f) => f.toLowerCase() === lower)
    if (byPath) return byPath
    return shortest(
      vault.files.filter((f) => `/${f.toLowerCase()}`.endsWith(`/${lower}`)),
      (f) => f,
    )
  }
  const note = () => {
    const want = lower.endsWith('.md') ? lower : `${lower}.md`
    const byPath = vault.notes.find((n) => n.path.toLowerCase() === want)
    if (byPath) return byPath
    return shortest(
      vault.notes.filter((n) => `/${n.path.toLowerCase()}`.endsWith(`/${want}`)),
      (n) => n.path,
    )
  }
  const f = lower.endsWith('.md') ? undefined : file()
  if (f) return { kind: 'file', path: f }
  const n = note()
  return n ? { kind: 'note', note: n } : undefined
}

function shortest<T>(items: T[], path: (t: T) => string): T | undefined {
  return [...items].sort((a, b) => path(a).length - path(b).length || path(a).localeCompare(path(b)))[0]
}
