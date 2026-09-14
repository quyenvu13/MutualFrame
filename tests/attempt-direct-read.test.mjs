import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const source = await fs.readFile(new URL('../src/genlayer.js', import.meta.url), 'utf8')
const start = source.indexOf('export async function readAttempts')
const end = source.indexOf('\nasync function estimateFees', start)
const block = source.slice(start, end)

test('attempt history is bounded by authoritative baseline attempt_count', () => {
  assert.match(block, /readBaseline\(bid\)/)
  assert.match(block, /baseline\?\.attempt_count/)
  assert.match(block, /Math\.min\(total, start \+ requested - 1\)/)
})

test('attempt history reads only exact scalar get_attempt records', () => {
  assert.match(block, /rows\.push\(await readAttempt\(bid, attemptId\)\)/)
  assert.doesNotMatch(block, /get_attempts/)
  assert.doesNotMatch(block, /invalid attempt id/)
})
