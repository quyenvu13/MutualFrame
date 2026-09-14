import test from 'node:test'
import assert from 'node:assert/strict'
import { loadAttemptHistory } from '../src/audit-history.js'

test('attempt history rejects invalid requested ranges', async () => {
  const reader = {
    readBaseline: async () => ({ baseline_id: 1, attempt_count: 1 }),
    readAttempt: async () => ({ baseline_id: 1, attempt_id: 1 }),
  }
  await assert.rejects(() => loadAttemptHistory(reader, 0, 1, 12), /Baseline ID/i)
  await assert.rejects(() => loadAttemptHistory(reader, 1, 0, 12), /From attempt/i)
  await assert.rejects(() => loadAttemptHistory(reader, 1, 1, 51), /Count/i)
})
