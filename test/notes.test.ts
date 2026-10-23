import { describe, expect, it } from 'vitest'
import { isPublishFalse, isPublishTrue, parseNote, propertyDate, propertyTags } from '../src/frontmatter.js'
import { inlineTags, selectNotes, SelectionError } from '../src/select.js'
import { headingAnchor, slugify, splitCode } from '../src/text.js'
import { readVault, resolve } from '../src/vault.js'

const tricky = readVault('test/fixtures/tricky')

describe('parseNote', () => {
  it('reads properties and body', () => {
    const p = parseNote('---\npublish: true\ntags: [a]\n---\nBody\n')
    expect(p.properties).toEqual({ publish: true, tags: ['a'] })
    expect(p.body).toBe('Body\n')
  })
  it('accepts a BOM and CRLF line endings', () => {
    const p = parseNote('﻿---\r\npublish: true\r\n---\r\nBody\r\n')
    expect(p.properties.publish).toBe(true)
    expect(p.body).toBe('Body\n')
  })
  it('treats a note without a block as having no properties', () => {
    expect(parseNote('Just text').properties).toEqual({})
  })
  it('accepts an empty block and the ... terminator', () => {
    expect(parseNote('---\n---\nx').body).toBe('x')
    expect(parseNote('---\na: 1\n...\nx').properties).toEqual({ a: 1 })
  })
  it('reports invalid YAML, an unclosed block and a non-mapping', () => {
    expect(parseNote('---\ntags: [x\n---\n').error).toMatch(/not valid YAML/)
    expect(parseNote('---\na: 1\nno end').error).toMatch(/never closed/)
    expect(parseNote('---\n- a\n- b\n---\n').error).toMatch(/key: value/)
  })
  it('counts only true or "true" as consent to publish', () => {
    expect([true, 'true', ' TRUE '].every(isPublishTrue)).toBe(true)
    expect([false, 'yes', 'on', 1, null, undefined].some(isPublishTrue)).toBe(false)
    expect(isPublishFalse(false) && isPublishFalse('false')).toBe(true)
  })
  it('reads tags and dates in their common forms', () => {
    expect(propertyTags({ tags: ['#Garden', 'books'] })).toEqual(['garden', 'books'])
    expect(propertyTags({ tags: 'a, b c' })).toEqual(['a', 'b', 'c'])
    expect(propertyDate({ created: '2026-10-12T10:00' })).toBe('2026-10-12')
    expect(propertyDate({ date: new Date('2026-01-02T00:00:00Z') })).toBe('2026-01-02')
    expect(propertyDate({})).toBeUndefined()
  })
})

describe('text helpers', () => {
  it('slugs titles', () => {
    expect(slugify('Site and sunlight')).toBe('site-and-sunlight')
    expect(slugify('Café & Crème!')).toBe('cafe-creme')
    expect(slugify('***')).toBe('note')
  })
  it('makes GitHub-style heading anchors', () => {
    expect(headingAnchor('12. Sharing notes')).toBe('12-sharing-notes')
    expect(headingAnchor('Next action')).toBe('next-action')
  })
  it('separates fenced and inline code from prose', () => {
    const segs = splitCode('a `b` c\n```\nd\n```\ne ``f ` g`` h\n')
    expect(segs.filter((s) => s.code).map((s) => s.text)).toEqual(['`b`', '```\nd\n```\n', '``f ` g``'])
  })
})

describe('resolve', () => {
  it('prefers an exact path, then the shortest path among same-named notes', () => {
    expect(resolve(tricky, 'Nested/Deep/Child')).toMatchObject({
      kind: 'note',
      note: { path: 'Public/Nested/Deep/Child.md' },
    })
    expect(resolve(tricky, 'Child')).toMatchObject({ kind: 'note', note: { path: 'Private/Child.md' } })
    expect(resolve(tricky, 'Public/Nested/Deep/Child.md')).toMatchObject({
      note: { path: 'Public/Nested/Deep/Child.md' },
    })
  })
  it('finds attachments by name and misses what is not there', () => {
    expect(resolve(tricky, 'diagram.png')).toEqual({ kind: 'file', path: 'Public/diagram.png' })
    expect(resolve(tricky, 'Nowhere')).toBeUndefined()
  })
  it('skips dot folders when reading a vault', () => {
    const vault = readVault('vault')
    expect(vault.notes.some((n) => n.path.startsWith('.'))).toBe(false)
  })
})

describe('selectNotes', () => {
  const paths = (sel: Parameters<typeof selectNotes>[1]) => selectNotes(tricky, sel).notes.map((n) => n.path)

  it('selects nothing without a rule', () => {
    expect(() => selectNotes(tricky, {})).toThrow(SelectionError)
  })
  it('selects by publish flag, string "true" included and "yes" excluded', () => {
    expect(paths({ publishFlag: true })).toEqual([
      'Private/Child.md',
      'Public/Hub.md',
      'Public/Nested/Deep/Child.md',
      'Public/Windows note.md',
    ])
  })
  it('requires every rule given', () => {
    expect(paths({ publishFlag: true, folder: 'Public' })).toEqual([
      'Public/Hub.md',
      'Public/Nested/Deep/Child.md',
      'Public/Windows note.md',
    ])
    expect(paths({ folder: 'Public/', tag: 'share' })).toEqual([
      'Public/Hub.md',
      'Public/No properties.md',
      'Public/Windows note.md',
    ])
  })
  it('lets publish: false win and leaves unreadable notes out', () => {
    const s = selectNotes(tricky, { folder: 'Public' })
    expect(s.optedOut.map((n) => n.path)).toEqual(['Public/Opted out.md'])
    expect(s.unreadable.map((n) => n.path)).toEqual(['Public/Broken yaml.md'])
    expect(s.notes.map((n) => n.path)).not.toContain('Public/Broken yaml.md')
  })
  it('finds inline tags in prose only, including nested tags', () => {
    expect(inlineTags('Text #share and #a/b, `#code` and\n```\n#fenced\n```\n# Heading 1 #2026')).toEqual([
      'share',
      'a/b',
    ])
  })
})
