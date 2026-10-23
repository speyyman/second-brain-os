import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// WCAG 2.1 contrast for the Reading Copy tokens, read straight from the stylesheet.
const css = readFileSync('theme/style.css', 'utf8')
const block = (re: RegExp) =>
  Object.fromEntries([...(re.exec(css)?.[1] ?? '').matchAll(/--([a-z]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]))
const light = block(/:root \{([^}]*)\}/)
const dark = block(/prefers-color-scheme: dark\) \{\s*:root \{([^}]*)\}/)

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const PAIRS: [text: string, ground: string][] = [
  ['ink', 'paper'],
  ['muted', 'paper'],
  ['link', 'paper'],
  ['ink', 'mark'],
  ['ink', 'aside'],
  ['link', 'aside'],
  ['muted', 'aside'],
  ['caution', 'aside'],
]

describe.each([
  ['light', light],
  ['dark', dark],
])('Reading Copy %s', (_name, tokens) => {
  it('defines every token', () => {
    for (const t of ['paper', 'ink', 'muted', 'link', 'rule', 'mark', 'aside', 'caution'])
      expect(tokens[t], t).toMatch(/^#/)
  })
  it.each(PAIRS)('%s on %s meets WCAG AA (4.5 : 1)', (text, ground) => {
    expect(contrast(tokens[text] as string, tokens[ground] as string)).toBeGreaterThanOrEqual(4.5)
  })
})
