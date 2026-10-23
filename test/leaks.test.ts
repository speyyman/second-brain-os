import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, posix } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { markdownAdapter } from '../src/adapters/markdown.js'
import { convert, strayLinks } from '../src/convert.js'
import { publish } from '../src/publish.js'
import { inlineTags, selectNotes } from '../src/select.js'
import { readVault, resolve, type Note } from '../src/vault.js'
import { secrets } from './secrets.js'

// The cases an independent review found leaking titles or paths, kept here so they stay fixed.

const vault = readVault('test/fixtures/tricky')
const leaks = vault.notes.find((n) => n.path === 'Public/Leaks.md') as Note
const out = convert(leaks.body, {
  vault,
  note: leaks,
  published: new Map([
    ['Public/Leaks.md', 'leaks'],
    ['Public/Nested/Deep/Child.md', 'child'],
    ['Public/Version 2.0.md', 'version-2-0'],
  ]),
  noteHref: markdownAdapter.noteHref,
  fileHref: (path) => markdownAdapter.fileHref(posix.basename(path)),
}).markdown

const tmp = mkdtempSync(join(tmpdir(), 'vault-publish-leaks-'))
afterAll(() => rmSync(tmp, { recursive: true, force: true }))

describe('every other way a note can point at a private one', () => {
  it('never mentions the private note or its folder', () => {
    expect(out).not.toMatch(/secret|Private\//i)
  })
  it('drops private reference definitions and rewrites published ones', () => {
    expect(out).toContain('[p]: child.md "Child"')
    expect(out).not.toMatch(/^\[r\]:/m)
    // The reference to the dropped definition reads as plain text.
    expect(out).toContain('A reference link and a [published ref][p] to the child.')
  })
  it('handles links without an extension and links by name', () => {
    expect(out).toContain('A link with no extension and one by name.')
  })
  it('empties raw HTML href and src that point at private or missing files', () => {
    expect(out).toContain('<a href="">raw link</a>')
    expect(out).toContain('<img src="" alt="x">')
  })
  it('removes missing images and keeps external ones', () => {
    expect(out).toContain('A missing image:  and an external one ![](https://example.org/a.png)')
  })
  it('resolves notes with a dot in the name, and leaves footnotes alone', () => {
    expect(out).toContain('[Version 2.0](version-2-0.md)')
    expect(out).toContain('[^1]: Footnotes stay as they are.')
  })
  it('the whole HTML export of the fixture carries no private title or path', () => {
    const dir = join(tmp, 'html')
    const r = publish({ vault, selection: { folder: 'Public', publishFlag: true }, format: 'html', out: dir })
    expect(r.ok).toBe(true)
    const pages = readdirSync(dir).filter((f) => f.endsWith('.html'))
    // Code is published as written (the fixture shows [[Secret plans]] inside code on purpose), so leave it out.
    const prose = (html: string) => html.replace(/<pre>[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>/g, '')
    for (const f of pages) {
      expect(prose(readFileSync(join(dir, f), 'utf8')), f).not.toMatch(/Secret plans|Secret%20plans|Private\//)
    }
  })
})

describe('strayLinks', () => {
  it('finds relative links that are not published pages, attachments or anchors', () => {
    const ok = (h: string) => h === 'child.md' || h.startsWith('attachments/')
    const md = [
      '[a](child.md) [b](#x) [c](https://x.org) [d](Private/x.md)',
      '[e]: other.md',
      '[^1]: a footnote',
      `<img src="attachments/a.png"> <a href='z.md'>z</a>`,
      '`[f](code.md)`',
    ].join('\n')
    expect(strayLinks(md, ok)).toEqual(['Private/x.md', 'other.md', 'z.md'])
  })
})

describe('attachments', () => {
  it('are copied under their own name, never their vault folder', () => {
    const v = join(tmp, 'att')
    mkdirSync(join(v, 'Private', 'Money'), { recursive: true })
    writeFileSync(join(v, 'Private', 'Money', 'chart.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    writeFileSync(join(v, 'Note.md'), '---\npublish: true\n---\n![[chart.png]]\n')
    const dir = join(tmp, 'att-out')
    const r = publish({ vault: v, selection: { publishFlag: true }, format: 'markdown', out: dir })
    expect(r.files).toEqual(['Private/Money/chart.png'])
    expect(readdirSync(join(dir, 'attachments'))).toEqual(['chart.png'])
    expect(readFileSync(join(dir, 'note.md'), 'utf8')).toContain('![chart](attachments/chart.png)')
  })
  it('have their names checked against the deny list', () => {
    const v = join(tmp, 'att-deny')
    mkdirSync(v)
    writeFileSync(join(v, 'alexandria-trip.png'), Buffer.from([0]))
    writeFileSync(join(v, 'Note.md'), '---\npublish: true\n---\n![[alexandria-trip.png|a photo]]\n')
    const r = publish({
      vault: v,
      selection: { publishFlag: true },
      format: 'markdown',
      dryRun: true,
      privacy: { deny: ['alexandria trip'] },
    })
    expect(r.ok).toBe(false)
    // The phrase matches the hyphenated file name, reported once, at the line that embeds it.
    expect(r.findings).toEqual([expect.objectContaining({ file: 'Note.md', line: 4, kind: 'deny-list' })])
  })
})

describe('reports and selection', () => {
  it('reports the line in the source note, properties included', () => {
    const v = join(tmp, 'lines')
    mkdirSync(v)
    const body = [
      '---',
      'publish: true',
      'tags: [a]',
      'status: active',
      '---',
      'One.',
      '',
      'Two.',
      '',
      `Write to ${secrets.email} please.`,
    ]
    writeFileSync(join(v, 'N.md'), body.join('\n') + '\n')
    const r = publish({ vault: v, selection: { publishFlag: true }, format: 'markdown', dryRun: true })
    expect(r.findings).toEqual([expect.objectContaining({ file: 'N.md', line: 10, column: 10, kind: 'email' })])
  })
  it('ignores tags written inside comments', () => {
    expect(inlineTags('Only tagged inside a comment %% #hidden %%.')).toEqual([])
    expect(selectNotes(vault, { tag: 'hidden' }).notes).toEqual([])
  })
  it('accepts a folder written with ./', () => {
    expect(selectNotes(vault, { folder: './Public/Nested', publishFlag: true }).notes.map((n) => n.path)).toEqual([
      'Public/Nested/Deep/Child.md',
    ])
  })
  it('prefers a note over a missing file for names with a dot', () => {
    expect(resolve(vault, 'Version 2.0')).toMatchObject({ kind: 'note', note: { path: 'Public/Version 2.0.md' } })
  })
  it('refuses an output folder inside the vault even when its name starts with two dots', () => {
    const v = join(tmp, 'dots')
    mkdirSync(v)
    writeFileSync(join(v, 'N.md'), '---\npublish: true\n---\nHi.\n')
    expect(() =>
      publish({ vault: v, selection: { publishFlag: true }, format: 'markdown', out: join(v, '..out') }),
    ).toThrow(/outside the vault/)
  })
})
