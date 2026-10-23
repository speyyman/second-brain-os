import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { SiteArticle } from '../src/adapters/site.js'
import { main } from '../src/cli.js'
import { MARKER } from '../src/publish.js'
import { secrets } from './secrets.js'

const tmp = mkdtempSync(join(tmpdir(), 'vault-publish-'))
afterAll(() => rmSync(tmp, { recursive: true, force: true }))

function cli(...args: string[]) {
  const lines: string[] = []
  const code = main(args, { log: (s) => lines.push(s), error: (s) => lines.push(s) })
  return { code, text: lines.join('\n') }
}

const listFiles = (dir: string, prefix = ''): string[] =>
  readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(dir, join(prefix, e.name)) : [join(prefix, e.name).replace(/\\/g, '/')],
  )

const RAISED_BED = ['vault', '--folder', '20 Projects/Raised Bed', '--publish-flag']

describe('the starter vault', () => {
  it('has no broken links', () => {
    const r = cli('check-links', 'vault')
    expect(r.text).toBe('Every link resolves.')
    expect(r.code).toBe(0)
  })

  it('publishes the sample project as Markdown that matches the golden copy', () => {
    const out = join(tmp, 'md')
    const r = cli(...RAISED_BED, '--out', out)
    expect(r.code).toBe(0)
    const golden = 'test/golden/raised-bed'
    const files = listFiles(golden)
    expect(
      listFiles(out)
        .filter((f) => f !== MARKER)
        .sort(),
    ).toEqual(files.sort())
    for (const f of files) expect(readFileSync(join(out, f), 'utf8'), f).toBe(readFileSync(join(golden, f), 'utf8'))
  })

  it('never exports the private note, its title, the comment or private properties', () => {
    const out = join(tmp, 'md-private')
    cli(...RAISED_BED, '--out', out)
    const all = listFiles(out)
      .map((f) => readFileSync(join(out, f), 'utf8'))
      .join('\n')
    expect(all).not.toMatch(/Budget scratchpad|budget-scratchpad/i)
    expect(all).not.toMatch(/fence might be replaced/)
    expect(all).not.toMatch(/^(status|next|project|publish):/m)
  })

  it('writes HTML pages with the theme, fonts and working links', () => {
    const out = join(tmp, 'html')
    expect(cli(...RAISED_BED, '--format', 'html', '--out', out).code).toBe(0)
    const files = listFiles(out)
    expect(files).toEqual(
      expect.arrayContaining(['index.html', 'raised-bed.html', 'style.css', 'fonts/literata-latin-400-normal.woff2']),
    )
    const page = readFileSync(join(out, 'site-and-sunlight.html'), 'utf8')
    expect(page).toContain('<html lang="en">')
    expect(page).toContain('href="raised-bed.html#next-action"')
    expect(page).toContain('<aside class="callout" data-callout="caution">')
    expect(readFileSync(join(out, 'raised-bed.html'), 'utf8')).toContain('<h2 id="next-action">Next action</h2>')
  })

  it("writes the site's article shape", () => {
    const out = join(tmp, 'site')
    const r = cli(...RAISED_BED, '--format', 'site', '--site-base', '/writing/', '--out', out)
    expect(r.code).toBe(0)
    const articles = JSON.parse(readFileSync(join(out, 'articles.json'), 'utf8')) as Record<string, SiteArticle>
    const hub = articles.raisedBed as SiteArticle
    expect(hub.path).toBe('/writing/raised-bed/')
    expect(hub.kind).toBe('essay')
    expect(hub.sections.map((s) => s.title)).toEqual(['Goal', 'Why it matters', 'Next action', 'Files', 'Log'])
    expect(hub.sections.find((s) => s.title === 'Next action')?.links).toEqual([
      { label: 'Site and sunlight', href: '/writing/site-and-sunlight/' },
    ])
    expect(r.text).toMatch(/materials-list|Materials list.*table/)
  })
})

describe('safety', () => {
  it('publishes nothing without a rule', () => {
    const r = cli('vault', '--out', join(tmp, 'none'))
    expect(r.code).toBe(1)
    expect(existsSync(join(tmp, 'none'))).toBe(false)
  })

  it('writes nothing on a dry run', () => {
    const out = join(tmp, 'dry')
    const r = cli(...RAISED_BED, '--dry-run', '--out', out)
    expect(r.code).toBe(0)
    expect(r.text).toContain('dry run, nothing written')
    expect(existsSync(out)).toBe(false)
  })

  it('refuses a folder it did not write, and one inside the vault', () => {
    const busy = join(tmp, 'busy')
    mkdirSync(busy)
    writeFileSync(join(busy, 'keep.txt'), 'mine')
    expect(cli(...RAISED_BED, '--out', busy).code).toBe(1)
    expect(readFileSync(join(busy, 'keep.txt'), 'utf8')).toBe('mine')
    expect(cli(...RAISED_BED, '--out', 'vault/out').code).toBe(1)
    expect(existsSync('vault/out')).toBe(false)
  })

  it('replaces its own earlier output', () => {
    const out = join(tmp, 'again')
    cli(...RAISED_BED, '--out', out)
    writeFileSync(join(out, 'stale.md'), 'old')
    expect(cli(...RAISED_BED, '--out', out).code).toBe(0)
    expect(existsSync(join(out, 'stale.md'))).toBe(false)
  })

  it('blocks a vault with planted secrets and says exactly where', () => {
    const v = join(tmp, 'planted')
    mkdirSync(v)
    const body = Object.values(secrets).join('\n\n')
    writeFileSync(
      join(v, 'Leaky.md'),
      `---\npublish: true\n---\nIntro.\n\n\`\`\`\n${body}\n\`\`\`\n\nMet Alexandria.\n`,
    )
    writeFileSync(join(v, 'deny.txt'), '# people\nAlexandria\n')
    const out = join(tmp, 'planted-out')
    const r = cli(v, '--publish-flag', '--deny', join(v, 'deny.txt'), '--out', out)
    expect(r.code).toBe(2)
    expect(existsSync(out)).toBe(false)
    for (const kind of [...Object.keys(secrets), 'deny-list']) expect(r.text).toContain(`  ${kind}  `)
    expect(r.text).toMatch(/Leaky\.md:\d+:\d+/)
    for (const s of Object.values(secrets)) expect(r.text).not.toContain(s)
  })

  it('lets an allow-listed address through', () => {
    const v = join(tmp, 'allowed')
    mkdirSync(v)
    writeFileSync(join(v, 'Contact.md'), `---\npublish: true\n---\nWrite to ${secrets.email}.\n`)
    writeFileSync(join(v, 'allow.txt'), `${secrets.email}\n`)
    expect(cli(v, '--publish-flag', '--out', join(tmp, 'allowed-out')).code).toBe(2)
    expect(cli(v, '--publish-flag', '--allow', join(v, 'allow.txt'), '--out', join(tmp, 'allowed-out')).code).toBe(0)
  })
})
