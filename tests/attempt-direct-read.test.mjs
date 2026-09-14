import test from 'node:test'
import assert from 'node:assert/strict'
import { loadAttemptHistory } from '../src/audit-history.js'

test('attempt history is bounded by authoritative baseline attempt_count', async () => {
  const calls = []
  const reader = {
    readBaseline: async () => ({ baseline_id: 1, attempt_count: 1 }),
    readAttempt: async (baselineId, attemptId) => {
      calls.push([baselineId, attemptId])
      return { baseline_id: baselineId, attempt_id: attemptId, verdict: 'MUTUAL_CHANGE_CONTROL', accepted: true, used_cache: false }
    },
  }
  const result = await loadAttemptHistory(reader, 1, 1, 12)
  assert.equal(result.items.length, 1)
  assert.deepEqual(calls, [[1, 1]])
})
