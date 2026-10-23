import { describe, expect, it } from 'vitest'
import { luhn, mask, parseList, scan } from '../src/privacy.js'
import { secrets } from './secrets.js'

const kinds = (text: string, opts = {}) => scan(text, 'note.md', opts).map((f) => f.kind)

describe('privacy scan finds', () => {
  it.each(Object.entries(secrets))('%s', (kind, sample) => {
    expect(kinds(`Some text ${sample} more text`)).toContain(kind)
  })
  it('secrets inside fenced code blocks', () => {
    expect(kinds(`\`\`\`sh\nexport TOKEN=${secrets.token}\n\`\`\``).length).toBeGreaterThan(0)
  })
  it('deny-list words, whole words only and case-insensitive', () => {
    expect(kinds('Met Alexandria at the market', { deny: ['alexandria'] })).toEqual(['deny-list'])
    expect(kinds('Alexandrian style', { deny: ['alexandria'] })).toEqual([])
    expect(kinds('the Blue Door project', { deny: ['blue door'] })).toEqual(['deny-list'])
  })
  it('the line and column of each finding', () => {
    const [f] = scan(`one\ntwo ${secrets.email}`, 'x.md')
    expect(f).toMatchObject({ file: 'x.md', line: 2, column: 5, kind: 'email' })
  })
})

describe('privacy scan leaves alone', () => {
  it.each([
    'Dates like 2026-10-22 and 2026-10-22T09:00',
    'Versions like 1.2.3 and 10.5281/zenodo.23604923',
    'Times like 09:30 and ratios like 16.2 : 1',
    'A price of $14.72 and twelve bushels',
    'An ISBN-like run 978-0-14-303943-3 that fails Luhn',
    'The 3 Musketeers and 221 pages',
    'A short number 555-0100',
    'https://www.gutenberg.org/ebooks/205',
  ])('%s', (text) => {
    expect(kinds(text)).toEqual([])
  })
  it('exact strings on the allow list', () => {
    expect(kinds(`Write to ${secrets.email}`, { allow: [secrets.email] })).toEqual([])
  })
})

describe('helpers', () => {
  it('checks Luhn digits', () => {
    expect(luhn('4111111111111111')).toBe(true)
    expect(luhn('4111111111111112')).toBe(false)
  })
  it('never repeats a secret in full', () => {
    for (const sample of Object.values(secrets)) {
      for (const f of scan(sample, 'x.md')) {
        expect(f.masked).toContain('*')
        expect(f.masked.replace(/\*+/g, '').length).toBeLessThanOrEqual(4)
      }
    }
    expect(mask('abcdefghij')).toBe('ab******ij')
  })
  it('reads list files with comments and blank lines', () => {
    expect(parseList('# names\nAlexandria\n\nBlue Door  # a project\r\n')).toEqual(['Alexandria', 'Blue Door'])
  })
})
