/** Strip a byte-order mark and turn CRLF or CR line endings into LF. */
export function normalizeNewlines(text: string): string {
  return text.replace(new RegExp('^' + String.fromCharCode(0xfeff)), '').replace(/\r\n?/g, '\n')
}

/** A URL-safe slug: lower case, accents removed, anything else becomes a single hyphen. */
export function slugify(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'note'
}

/** The anchor GitHub-style renderers give a heading: lower case, punctuation dropped, spaces to hyphens. */
export function headingAnchor(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-')
}

/** 1-based line and column of an offset in a string. */
export function lineCol(text: string, offset: number): { line: number; column: number } {
  let line = 1
  let last = -1
  for (let i = 0; i < offset; i++) {
    if (text.charCodeAt(i) === 10) {
      line++
      last = i
    }
  }
  return { line, column: offset - last }
}

/** Split Markdown into code (fenced blocks and inline spans) and prose, so rewrites only touch prose. */
export type Segment = { code: boolean; text: string }

export function splitCode(markdown: string): Segment[] {
  const out: Segment[] = []
  const push = (code: boolean, text: string) => {
    if (!text) return
    const prev = out[out.length - 1]
    if (prev && prev.code === code) prev.text += text
    else out.push({ code, text })
  }
  const lines = markdown.split(/(?<=\n)/)
  let fence: string | null = null
  let prose = ''
  const flushProse = () => {
    // Inline code spans: a run of backticks closed by a run of the same length.
    const re = /(`+)([\s\S]*?[^`])\1(?!`)/g
    let last = 0
    for (const m of prose.matchAll(re)) {
      push(false, prose.slice(last, m.index))
      push(true, m[0])
      last = m.index + m[0].length
    }
    push(false, prose.slice(last))
    prose = ''
  }
  for (const line of lines) {
    const open = /^ {0,3}(`{3,}|~{3,})/.exec(line)
    if (fence === null && open?.[1]) {
      flushProse()
      fence = open[1]
      push(true, line)
    } else if (fence !== null) {
      push(true, line)
      const close = new RegExp(`^ {0,3}${fence[0] === '`' ? '`' : '~'}{${fence.length},}\\s*$`)
      if (close.test(line)) fence = null
    } else {
      prose += line
    }
  }
  flushProse()
  return out
}

/** Apply a rewrite to the prose parts of Markdown only. */
export function mapProse(markdown: string, fn: (prose: string) => string): string {
  return splitCode(markdown)
    .map((s) => (s.code ? s.text : fn(s.text)))
    .join('')
}
