import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeListResult } from '../src/genlayer.js'

test('attempt list accepts a native array', () => {
  const rows = [{ attempt_id: 1 }]
  assert.deepEqual(normalizeListResult(rows), rows)
})

test('attempt list decodes a JSON-string array', () => {
  assert.deepEqual(normalizeListResult('[{"attempt_id":1}]'), [{ attempt_id: 1 }])
})

test('attempt list unwraps common RPC result wrappers', () => {
  assert.deepEqual(normalizeListResult({ result: '[{"attempt_id":1}]' }), [{ attempt_id: 1 }])
})

test('attempt list rejects non-list shapes so fallback can run', () => {
  assert.equal(normalizeListResult({ attempt_id: 1 }), null)
})
