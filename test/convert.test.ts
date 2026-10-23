import { describe, expect, it } from 'vitest'
import { markdownAdapter } from '../src/adapters/markdown.js'
import { convert, PRIVATE_LINK_TEXT } from '../src/convert.js'
import { readVault, type Note } from '../src/vault.js'

const vault = readVault('test/fixtures/tricky')
const note = (path: string) => vault.notes.find((n) => n.path === path) as Note
const hub = note('Public/Hub.md')
const published = new Map([
  ['Public/Hub.md', 'hub'],
  ['Public/Nested/Deep/Child.md', 'child'],
])
const run = (body: string, htmlCallouts = false) =>
  convert(body, {
    vault,
    note: hub,
    published,
    noteHref: markdownAdapter.noteHref,
    fileHref: markdownAdapter.fileHref,
    htmlCallouts,
  })

describe('links to published notes', () => {
  it('rewrites wikilinks, aliases and headings', () => {
    expect(run('[[Nested/Deep/Child|the child]]').markdown).toBe('[the child](child.md)\n')
    expect(run('[[Nested/Deep/Child#Part two]]').markdown).toBe('[Child: Part two](child.md#part-two)\n')
    expect(run('[[#Second section|jump]]').markdown).toBe('[jump](#second-section)\n')
  })
  it('rewrites standard Markdown links to notes, relative to the note', () => {
    expect(run('[see](Nested/Deep/Child.md)').markdown).toBe('[see](child.md)\n')
  })
  it('turns an embedded published note into a link', () => {
    expect(run('![[Nested/Deep/Child]]').markdown).toBe('[Child](child.md)\n')
  })
  it('handles the escaped alias pipe inside tables', () => {
    expect(run('| [[Nested/Deep/Child\\|in a table]] |').markdown).toBe('| [in a table](child.md) |\n')
  })
})

describe('links to notes that are not published', () => {
  it('keeps an alias, never the title', () => {
    const r = run('[[Secret plans|our plans]]')
    expect(r.markdown).toBe('our plans\n')
    expect(r.redactions).toEqual([{ target: 'Secret plans', reason: 'not published' }])
  })
  it('replaces an unaliased link, or an alias that repeats the title', () => {
    expect(run('[[Secret plans]]').markdown).toBe(`${PRIVATE_LINK_TEXT}\n`)
    expect(run('[[Secret plans|Secret Plans]]').markdown).toBe(`${PRIVATE_LINK_TEXT}\n`)
    expect(run('[[Secret plans#Some heading]]').markdown).toBe(`${PRIVATE_LINK_TEXT}\n`)
  })
  it('removes embeds of private notes entirely', () => {
    expect(run('Before ![[Secret plans]] after').markdown).toBe('Before  after\n')
  })
  it('does not leak the title of a note that does not exist', () => {
    const r = run('[[Nowhere at all]]')
    expect(r.markdown).toBe(`${PRIVATE_LINK_TEXT}\n`)
    expect(r.redactions[0]?.reason).toBe('not found')
  })
  it('drops Markdown links to private notes but keeps their text', () => {
    expect(run('[hidden](../Private/Secret%20plans.md)').markdown).toBe('hidden\n')
  })
  it('follows Obsidian: a bare name resolves to the shortest path, here a private note', () => {
    expect(run('[[Child]]').markdown).toBe(`${PRIVATE_LINK_TEXT}\n`)
  })
})

describe('Obsidian syntax', () => {
  it('removes comments, including multi-line ones and their links', () => {
    const r = run('a %% one %% b\n%% two\nlines [[Secret plans]] %%\nc')
    expect(r.markdown).toBe('a  b\n\nc\n')
    expect(r.markdown).not.toMatch(/Secret|two/)
  })
  it('hides the rest of the note after an unclosed comment', () => {
    expect(run('kept %% hidden\nstill hidden\n```\ncode too\n```\n').markdown).toBe('kept\n')
  })
  it('leaves code exactly as written', () => {
    const body =
      'Use `[[Secret plans]]` or `%% x %%`.\n\n```md\n[[Secret plans]] ==x== %% y %%\n> [!note] not a callout\n```\n'
    expect(run(body).markdown).toBe(body)
  })
  it('converts highlights and strips block ids', () => {
    expect(run('a ==b c== d ^id-1\n^loose').markdown).toBe('a <mark>b c</mark> d\n')
  })
  it('turns callouts into a titled blockquote, or an aside for HTML', () => {
    expect(run('> [!caution] Uncertain\n> Body with `code`.').markdown).toBe(
      '> **Uncertain**\n>\n> Body with `code`.\n',
    )
    expect(run('> [!tip]-\n> Folded').markdown).toBe('> **Tip**\n>\n> Folded\n')
    const html = run('> [!caution] Uncertain\n> Body', true).markdown
    expect(html).toContain('<aside class="callout" data-callout="caution">')
    expect(html).toContain('<p class="callout-title">Uncertain</p>')
  })
  it('collects attachments and gives images their alt text', () => {
    const r = run('![[diagram.png|300]] and ![[diagram.png|A diagram]]')
    expect(r.markdown).toBe(
      '![diagram](attachments/public-diagram.png) and ![A diagram](attachments/public-diagram.png)\n',
    )
    expect(r.files).toEqual(['Public/diagram.png'])
  })
})
