import test from 'node:test'
import assert from 'node:assert/strict'
import {
  executionOutcome,
  rawLeaderExecution,
  verifyProposalPostcondition,
  verifyRollbackPostcondition,
} from '../src/tx-truth.js'

test('explicit SDK execution success is recognized', () => {
  assert.deepEqual(executionOutcome({ txExecutionResultName: 'FINISHED_WITH_RETURN' }), {
    ok: true, name: 'FINISHED_WITH_RETURN', evidence: 'SDK',
  })
})

test('leader receipt success is recognized when normalized field is absent', () => {
  const value = { consensus_data: { leader_receipt: { mode: 'leader', execution_result: 'SUCCESS' } } }
  assert.equal(rawLeaderExecution(value), 'SUCCESS')
  assert.equal(executionOutcome(value).ok, true)
  assert.equal(executionOutcome(value).evidence, 'LEADER_RECEIPT')
})

test('leader receipt error is not converted into success', () => {
  const value = { consensus_data: { leader_receipt: [{ mode: 'leader', execution_result: 'ERROR' }] } }
  assert.equal(executionOutcome(value).ok, false)
})

test('missing execution evidence remains unknown', () => {
  assert.equal(executionOutcome({ statusName: 'FINALIZED' }).ok, null)
})

test('mutual verdict must advance governance exactly once', () => {
  const before = { attempt_count: 2, version_count: 1, active_governance_id: 7, unilateral_power_blocks: 1, out_of_scope_blocks: 1 }
  const after = { attempt_count: 3, version_count: 2, active_governance_id: 8, unilateral_power_blocks: 1, out_of_scope_blocks: 1 }
  const attempt = { verdict: 'MUTUAL_CHANGE_CONTROL', accepted: true, resulting_governance_id: 8 }
  assert.equal(verifyProposalPostcondition(before, after, attempt).ok, true)
})

test('unilateral verdict blocks without replacing active governance', () => {
  const before = { attempt_count: 1, version_count: 1, active_governance_id: 3, unilateral_power_blocks: 0, out_of_scope_blocks: 0 }
  const after = { attempt_count: 2, version_count: 1, active_governance_id: 3, unilateral_power_blocks: 1, out_of_scope_blocks: 0 }
  const attempt = { verdict: 'UNILATERAL_CHANGE_POWER', accepted: false, resulting_governance_id: 0 }
  assert.equal(verifyProposalPostcondition(before, after, attempt).ok, true)
})

test('direct rewrite blocks without replacing active governance', () => {
  const before = { attempt_count: 4, version_count: 2, active_governance_id: 4, unilateral_power_blocks: 2, out_of_scope_blocks: 0 }
  const after = { attempt_count: 5, version_count: 2, active_governance_id: 4, unilateral_power_blocks: 2, out_of_scope_blocks: 1 }
  const attempt = { verdict: 'OUT_OF_SCOPE_DIRECT_CHANGE', accepted: false, resulting_governance_id: 0 }
  assert.equal(verifyProposalPostcondition(before, after, attempt).ok, true)
})

test('rollback proof requires every protected counter and active version to remain unchanged', () => {
  const before = { active_governance_id: 1, active_version: 1, version_count: 1, attempt_count: 4, unilateral_power_blocks: 2, out_of_scope_blocks: 1 }
  assert.equal(verifyRollbackPostcondition(before, { ...before }).ok, true)
  assert.equal(verifyRollbackPostcondition(before, { ...before, attempt_count: 5 }).ok, false)
})
