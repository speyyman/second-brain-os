#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { FORMATS, type Format } from './adapters/index.js'
import { checkLinks } from './check-links.js'
import { parseList } from './privacy.js'
import { OutputError, publish, type PublishReport } from './publish.js'
import { SelectionError } from './select.js'
import { readVault } from './vault.js'

export const USAGE = `vault-publish: share chosen notes from an Obsidian vault without exposing the rest.

Usage
  vault-publish <vault> --out <folder> [rules] [options]
  vault-publish check-links <vault>

Rules (at least one; a note must pass every rule given; publish: false always wins)
  --publish-flag         notes with publish: true in their properties
  --folder <path>        notes inside this vault folder
  --tag <tag>            notes with this tag, in properties or inline

Options
  --format <f>           markdown (default), html or site
  --site-base <path>     where site pages will live, default /writing/
  --deny <file>          words that must never be published, one per line
  --allow <file>         exact strings that are fine to publish, one per line
  --dry-run              show what would be published and write nothing
  --help                 this text

Exit codes: 0 published (or dry run clean), 1 usage or input error, 2 blocked by the privacy check.`

type Out = { log: (s: string) => void; error: (s: string) => void }

function printReport(r: PublishReport, dryRun: boolean, out: Out) {
  const n = r.pages.length
  out.log(`${n} note${n === 1 ? '' : 's'} selected${dryRun ? ' (dry run, nothing written)' : ''}:`)
  for (const p of r.pages) {
    out.log(`  ${p.path}  ->  ${p.slug}`)
    for (const red of p.redactions) out.log(`      link to "${red.target}" made plain text (${red.reason})`)
  }
  for (const p of r.optedOut) out.log(`  skipped ${p} (publish: false)`)
  for (const u of r.unreadable) out.error(`  skipped ${u.path}: ${u.error}`)
  if (r.files.length) {
    out.log(`Attachments (not scanned; look at them before sharing):`)
    for (const f of r.files) out.log(`  ${f}`)
  }
  for (const w of r.warnings) out.error(`warning: ${w}`)
  if (r.findings.length) {
    out.error(
      `\nBlocked: ${r.findings.length} possible private detail${r.findings.length === 1 ? '' : 's'} found. Nothing was written.`,
    )
    for (const f of r.findings) out.error(`  ${f.file}:${f.line}:${f.column}  ${f.kind}  ${f.masked}`)
    out.error(`Remove them from the note, or add an exact string to an --allow file if it is meant to be public.`)
  } else if (!dryRun) {
    out.log(`Wrote ${r.written.length} files.`)
  }
}

/** Run the CLI. Returns the exit code; never calls process.exit itself, so it can be tested. */
export function main(argv: string[], out: Out = { log: console.log, error: console.error }): number {
  let args
  try {
    args = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        out: { type: 'string' },
        'publish-flag': { type: 'boolean' },
        folder: { type: 'string' },
        tag: { type: 'string' },
        format: { type: 'string', default: 'markdown' },
        'site-base': { type: 'string', default: '/writing/' },
        deny: { type: 'string' },
        allow: { type: 'string' },
        'dry-run': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    })
  } catch (e) {
    out.error(`${(e as Error).message}\n\n${USAGE}`)
    return 1
  }
  const { values: v, positionals } = args
  if (v.help || positionals.length === 0) {
    out.log(USAGE)
    return v.help ? 0 : 1
  }

  try {
    if (positionals[0] === 'check-links') {
      const root = positionals[1]
      if (!root) throw new SelectionError('check-links needs a vault folder.')
      const broken = checkLinks(readVault(root))
      for (const b of broken) out.error(`${b.from}: ${b.link} (${b.problem})`)
      out.log(broken.length ? `${broken.length} broken link(s).` : 'Every link resolves.')
      return broken.length ? 1 : 0
    }

    const format = v.format as Format
    if (!FORMATS.includes(format)) throw new SelectionError(`Unknown format "${v.format}". Use ${FORMATS.join(', ')}.`)
    const read = (f?: string) => (f ? parseList(readFileSync(f, 'utf8')) : [])
    const dryRun = !!v['dry-run']
    const report = publish({
      vault: positionals[0] as string,
      selection: { publishFlag: v['publish-flag'], folder: v.folder, tag: v.tag },
      format,
      out: v.out,
      dryRun,
      privacy: { deny: read(v.deny), allow: read(v.allow) },
      site: { base: v['site-base'] as string },
    })
    printReport(report, dryRun, out)
    return report.ok ? 0 : 2
  } catch (e) {
    if (e instanceof SelectionError || e instanceof OutputError || (e as NodeJS.ErrnoException).code === 'ENOENT') {
      out.error((e as Error).message)
      return 1
    }
    throw e
  }
}

const isEntry = (() => {
  try {
    return (
      process.argv[1] !== undefined && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
    )
  } catch {
    return false
  }
})()
if (isEntry) process.exitCode = main(process.argv.slice(2))
