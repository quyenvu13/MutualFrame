import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const source = await fs.readFile(new URL('../src/genlayer.js', import.meta.url), 'utf8')

test('attempt history uses exact scalar get_attempt reads', () => {
  assert.match(source, /rows\.push\(await readAttempt\(bid, attemptId\)\)/)
})

test('attempt history is not gated by baseline attempt_count', () => {
  const start = source.indexOf('export async function readAttempts')
  const end = source.indexOf('\nasync function estimateFees', start)
  const block = source.slice(start, end)
  assert.doesNotMatch(block, /attempt_count/)
  assert.match(block, /invalid attempt id/)
})
