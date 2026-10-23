import { parse } from 'yaml'
import { normalizeNewlines } from './text.js'

export type Properties = Record<string, unknown>

export type Parsed = {
  /** The note's properties, empty when it has none. */
  properties: Properties
  /** Everything after the properties block. */
  body: string
  /** Set when a properties block exists but is not valid YAML or not a mapping. */
  error?: string
}

/**
 * Split a note into its YAML properties and its body. Accepts a BOM, CRLF line endings, an
 * empty block, and `...` as the closing line. A block that does not parse is reported, never
 * guessed at, so a broken note is not published by accident.
 */
export function parseNote(raw: string): Parsed {
  const text = normalizeNewlines(raw)
  if (!text.startsWith('---\n')) return { properties: {}, body: text }
  const close = /^(?:---|\.\.\.)[ \t]*$/m
  const rest = text.slice(4)
  const m = close.exec(rest)
  if (!m) return { properties: {}, body: text, error: 'properties block is never closed' }
  const yaml = rest.slice(0, m.index)
  const body = rest.slice(m.index + m[0].length).replace(/^\n/, '')
  if (!yaml.trim()) return { properties: {}, body }
  try {
    const value: unknown = parse(yaml)
    if (value === null || value === undefined) return { properties: {}, body }
    if (typeof value !== 'object' || Array.isArray(value)) {
      return { properties: {}, body, error: 'properties block is not a list of key: value pairs' }
    }
    return { properties: value as Properties, body }
  } catch (e) {
    return { properties: {}, body, error: `properties block is not valid YAML: ${(e as Error).message.split('\n')[0]}` }
  }
}

/** True only for `publish: true` or the string "true". Anything else, including "yes", is not consent. */
export function isPublishTrue(value: unknown): boolean {
  return value === true || (typeof value === 'string' && value.trim().toLowerCase() === 'true')
}

/** True for `publish: false` or "false": an explicit opt-out that overrides folder and tag rules. */
export function isPublishFalse(value: unknown): boolean {
  return value === false || (typeof value === 'string' && value.trim().toLowerCase() === 'false')
}

/** Tags from properties, as lower-case strings without the leading `#`. Accepts a list or a comma or space separated string. */
export function propertyTags(props: Properties): string[] {
  const raw = props.tags ?? props.tag
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,\s]+/) : []
  return list
    .filter((t): t is string | number => typeof t === 'string' || typeof t === 'number')
    .map((t) => String(t).trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean)
}

/** A date property (created, date) as YYYY-MM-DD, or undefined. */
export function propertyDate(props: Properties): string | undefined {
  for (const key of ['date', 'created']) {
    const v = props[key]
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10)
    if (typeof v === 'string') {
      const m = /^(\d{4}-\d{2}-\d{2})/.exec(v.trim())
      if (m?.[1]) return m[1]
    }
  }
  return undefined
}
