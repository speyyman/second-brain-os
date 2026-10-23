// End-to-end: run the built `vault-publish` binary as a user would, on the starter vault and on
// a vault with a planted secret, and check exit codes and output. Run with `npm run e2e`.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const tmp = mkdtempSync(join(tmpdir(), 'vault-publish-e2e-'))
let failed = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${ok ? '' : `\n      ${detail}`}`)
  if (!ok) failed++
}
const run = (...args) => {
  const r = spawnSync(process.execPath, ['dist/cli.js', ...args], { encoding: 'utf8' })
  return { code: r.status, out: `${r.stdout}${r.stderr}` }
}

try {
  let r = run('--help')
  check('--help exits 0 and prints usage', r.code === 0 && r.out.includes('Usage'), r.out)

  r = run('check-links', 'vault')
  check('every link in the starter vault resolves', r.code === 0, r.out)

  r = run('vault', '--out', join(tmp, 'x'))
  check('no rule, nothing published (exit 1)', r.code === 1 && !existsSync(join(tmp, 'x')), r.out)

  const html = join(tmp, 'html')
  r = run('vault', '--folder', '20 Projects/Raised Bed', '--publish-flag', '--format', 'html', '--out', html)
  const page = existsSync(join(html, 'raised-bed.html')) ? readFileSync(join(html, 'raised-bed.html'), 'utf8') : ''
  check('HTML export of the sample project', r.code === 0 && page.includes('<h1>Raised Bed</h1>'), r.out)
  check('the private note stays private', !page.includes('Budget scratchpad') && page.includes('a private note'), page)

  const leaky = join(tmp, 'leaky')
  mkdirSync(leaky)
  // Assembled at run time so this file never holds a key-shaped string.
  const token = ['gh', 'p_', 'Q7'.repeat(18)].join('')
  writeFileSync(join(leaky, 'Note.md'), `---\npublish: true\n---\nConfig:\n\n\`\`\`\nTOKEN=${token}\n\`\`\`\n`)
  r = run(leaky, '--publish-flag', '--out', join(tmp, 'leaky-out'))
  check('a planted token blocks the export (exit 2)', r.code === 2 && !existsSync(join(tmp, 'leaky-out')), r.out)
  check('the report names the file and line and hides the token', /Note\.md:6:\d+\s+token/.test(r.out) && !r.out.includes(token), r.out)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

if (failed) {
  console.error(`${failed} end-to-end check(s) failed`)
  process.exit(1)
}
console.log('All end-to-end checks passed.')
