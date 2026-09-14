import test from 'node:test'
import assert from 'node:assert/strict'
import { loadAttemptHistory } from '../src/audit-history.js'

function reader(total = 1) {
  const calls = []
  return {
    calls,
    readBaseline: async (id) => ({ baseline_id: id, attempt_count: total }),
    readAttempt: async (baselineId, attemptId) => {
      calls.push([baselineId, attemptId])
      return { baseline_id: baselineId, attempt_id: attemptId, verdict: 'MUTUAL_CHANGE_CONTROL', accepted: true, used_cache: false }
    },
  }
}

test('audit loader reads only authoritative existing attempts', async () => {
  const r = reader(1)
  const out = await loadAttemptHistory(r, 1, 1, 12)
  assert.equal(out.total, 1)
  assert.equal(out.items.length, 1)
  assert.deepEqual(r.calls, [[1, 1]])
})

test('audit loader respects requested range without probing beyond count', async () => {
  const r = reader(4)
  const out = await loadAttemptHistory(r, 1, 3, 12)
  assert.deepEqual(out.items.map((x) => x.attempt_id), [3, 4])
  assert.deepEqual(r.calls, [[1, 3], [1, 4]])
})

test('audit loader returns empty range without scalar reads', async () => {
  const r = reader(1)
  const out = await loadAttemptHistory(r, 1, 2, 12)
  assert.deepEqual(out.items, [])
  assert.deepEqual(r.calls, [])
})

test('audit loader fails closed on mismatched returned ids', async () => {
  const r = {
    readBaseline: async () => ({ baseline_id: 1, attempt_count: 1 }),
    readAttempt: async () => ({ baseline_id: 1, attempt_id: 2 }),
  }
  await assert.rejects(() => loadAttemptHistory(r, 1, 1, 12), /mismatch/i)
})
