import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function getSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)
    return entry.isDirectory() ? getSourceFiles(entryPath) : [entryPath]
  })
}

const sourceFiles = [join(root, 'index.html'), ...getSourceFiles(join(root, 'src'))]
const unsafePatterns = [
  /dangerouslySetInnerHTML/u,
  /\b(?:innerHTML|outerHTML)\s*=/u,
  /insertAdjacentHTML/u,
  /\beval\s*\(/u,
  /new\s+Function\s*\(/u,
  /document\.write\s*\(/u,
  /javascript\s*:/iu,
]

for (const sourcePath of sourceFiles) {
  const source = readFileSync(sourcePath, 'utf8')
  const relativePath = sourcePath.slice(root.length + 1)
  for (const pattern of unsafePatterns) {
    assert.doesNotMatch(source, pattern, `${relativePath} contains a blocked DOM or code-execution pattern: ${pattern}`)
  }
}

const html = readFileSync(join(root, 'index.html'), 'utf8')
assert.match(html, /http-equiv="Content-Security-Policy"/u, 'index.html should define a Content-Security-Policy')
assert.match(html, /default-src 'self'/u, 'Content-Security-Policy should default to same-origin resources')
assert.match(html, /object-src 'none'/u, 'Content-Security-Policy should disable plugin objects')

const progressSource = readFileSync(join(root, 'src/data/progress.ts'), 'utf8')
assert.match(progressSource, /MAX_PROGRESS_STORAGE_LENGTH/u, 'saved progress should have a bounded storage payload')

console.log('Safety validation passed: no unsafe DOM/code-execution sinks, CSP metadata, and bounded progress storage are present.')
