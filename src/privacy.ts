import { lineCol } from './text.js'

export type FindingKind =
  | 'email'
  | 'phone'
  | 'street-address'
  | 'card-number'
  | 'id-number'
  | 'private-key'
  | 'api-key'
  | 'token'
  | 'secret-assignment'
  | 'deny-list'

export type Finding = {
  file: string
  line: number
  column: number
  kind: FindingKind
  /** The match with its middle hidden, so the report never repeats a secret in full. */
  masked: string
}

export type PrivacyOptions = {
  /** Words or phrases that must never be published (names, places, project names). Case-insensitive, whole words. */
  deny?: string[]
  /** Exact strings that are fine to publish, such as your public email address. */
  allow?: string[]
}

type Rule = { kind: FindingKind; re: RegExp; check?: (match: string) => boolean }

const RULES: Rule[] = [
  { kind: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY( BLOCK)?-----/g },
  { kind: 'api-key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { kind: 'api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { kind: 'api-key', re: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/g },
  { kind: 'api-key', re: /\b(?:sk|rk|pk)_(?:live|test)_[0-9A-Za-z]{16,}\b/g },
  { kind: 'token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
  { kind: 'token', re: /\bgithub_pat_[A-Za-z0-9_]{50,}\b/g },
  { kind: 'token', re: /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/g },
  { kind: 'token', re: /\bnpm_[A-Za-z0-9]{36}\b/g },
  { kind: 'token', re: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g },
  {
    kind: 'secret-assignment',
    re: /\b(?:api[_-]?key|secret|token|passwd|password|pwd|client[_-]?secret|access[_-]?key)\b["']?\s*[:=]\s*["']?[^\s"'`,;]{8,}/gi,
  },
  { kind: 'email', re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g },
  {
    kind: 'card-number',
    re: /(?<![\d-])(?:\d[ -]?){12,18}\d(?![\d-])/g,
    check: (m) => {
      const digits = m.replace(/\D/g, '')
      return digits.length >= 13 && digits.length <= 19 && luhn(digits)
    },
  },
  { kind: 'id-number', re: /(?<![\d-])\d{3}-\d{2}-\d{4}(?![\d-])/g },
  {
    kind: 'phone',
    re: /(?<![\w./-])(?:\+\d{1,3}[ .-]?)?(?:\(\d{2,4}\)[ .-]?|\d{2,4}[ .-])\d{3,4}[ .-]\d{3,4}(?![\w/-])/g,
    check: (m) => {
      const digits = m.replace(/\D/g, '')
      // Ten or more digits, and not a date such as 2026-10-22 or a version such as 1.2.3.
      return digits.length >= 10 && digits.length <= 15 && !/^\d{4}[-.]\d{2}[-.]\d{2}$/.test(m.trim())
    },
  },
  {
    kind: 'street-address',
    re: /\b\d{1,5}(?:[A-Za-z])?\s+(?:[A-Z][A-Za-z'.-]*\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl|Terrace|Ter|Parkway|Pkwy|Highway|Hwy|Close|Crescent|Square|Sq)\b\.?/g,
  },
  { kind: 'street-address', re: /\bP\.?\s?O\.?\s+Box\s+\d+/gi },
]

/** Luhn checksum, the check digit card numbers carry. */
export function luhn(digits: string): boolean {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

export function mask(s: string): string {
  const t = s.trim()
  if (t.length <= 6) return '*'.repeat(t.length)
  return `${t.slice(0, 2)}${'*'.repeat(Math.min(t.length - 4, 12))}${t.slice(-2)}`
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Look for things that should never leave a private vault. Every match is reported with its
 * place; the caller decides to block. Code blocks are scanned too, since that is where keys
 * usually get pasted.
 */
export function scan(text: string, file: string, options: PrivacyOptions = {}): Finding[] {
  const allow = new Set((options.allow ?? []).map((a) => a.trim().toLowerCase()).filter(Boolean))
  const findings: Finding[] = []
  const taken: [number, number][] = []
  const overlaps = (a: number, b: number) => taken.some(([s, e]) => a < e && b > s)

  const add = (kind: FindingKind, index: number, match: string) => {
    const end = index + match.length
    if (allow.has(match.trim().toLowerCase()) || overlaps(index, end)) return
    taken.push([index, end])
    findings.push({ file, ...lineCol(text, index), kind, masked: mask(match) })
  }

  for (const rule of RULES) {
    for (const m of text.matchAll(rule.re)) {
      if (rule.check && !rule.check(m[0])) continue
      add(rule.kind, m.index, m[0])
    }
  }
  for (const term of options.deny ?? []) {
    const t = term.trim()
    if (!t) continue
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(t)}(?![\\p{L}\\p{N}])`, 'giu')
    for (const m of text.matchAll(re)) add('deny-list', m.index, m[0])
  }
  return findings.sort((a, b) => a.line - b.line || a.column - b.column)
}

/** Read a deny or allow list: one entry per line, `#` starts a comment, blank lines ignored. */
export function parseList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/(^|\s)#.*$/, '').trim())
    .filter(Boolean)
}
