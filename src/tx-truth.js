export function upper(value) {
  return String(value ?? '').toUpperCase()
}

export function rawLeaderExecution(value) {
  const consensus = value?.consensus_data
    || value?.consensusData
    || value?.transaction?.consensus_data
    || value?.transaction?.consensusData

  let leader = consensus?.leader_receipt || consensus?.leaderReceipt
  if (Array.isArray(leader)) {
    leader = leader.find((item) => upper(item?.mode) === 'LEADER') || leader[0]
  }

  return upper(leader?.execution_result || leader?.executionResult)
}

export function executionName(value) {
  return upper(
    value?.txExecutionResultName
      || value?.executionResultName
      || value?.transaction?.txExecutionResultName
      || value?.transaction?.executionResultName,
  )
}

export function executionOutcome(...sources) {
  for (const source of sources.filter(Boolean)) {
    const normalized = executionName(source)
    if (normalized === 'FINISHED_WITH_RETURN' || normalized === 'SUCCESS') {
      return { ok: true, name: 'FINISHED_WITH_RETURN', evidence: 'SDK' }
    }
    if (normalized === 'FINISHED_WITH_ERROR' || normalized === 'ERROR') {
      return { ok: false, name: 'FINISHED_WITH_ERROR', evidence: 'SDK' }
    }

    const raw = rawLeaderExecution(source)
    if (raw === 'SUCCESS' || raw === 'FINISHED_WITH_RETURN') {
      return { ok: true, name: 'FINISHED_WITH_RETURN', evidence: 'LEADER_RECEIPT' }
    }
    if (raw === 'ERROR' || raw === 'FINISHED_WITH_ERROR') {
      return { ok: false, name: 'FINISHED_WITH_ERROR', evidence: 'LEADER_RECEIPT' }
    }
  }

  return { ok: null, name: 'EXECUTION_RESULT_UNAVAILABLE', evidence: 'NONE' }
}

export function rollbackReason(value) {
  const candidates = [
    value?.error,
    value?.message,
    value?.returnData,
    value?.return_data,
    value?.transaction?.error,
    value?.transaction?.message,
    value?.transaction?.returnData,
    value?.transaction?.return_data,
  ]

  const consensus = value?.consensus_data || value?.consensusData || value?.transaction?.consensus_data || value?.transaction?.consensusData
  let leader = consensus?.leader_receipt || consensus?.leaderReceipt
  if (Array.isArray(leader)) leader = leader.find((item) => upper(item?.mode) === 'LEADER') || leader[0]
  candidates.push(leader?.error, leader?.message, leader?.return_data, leader?.returnData)

  const reason = candidates.find((item) => typeof item === 'string' && item.trim())
  return reason ? reason.trim() : 'Contract execution rolled back.'
}

export function verifyProposalPostcondition(before, after, attempt) {
  if (!before || !after || !attempt) return { ok: false, message: 'Postcondition data is incomplete.' }
  if (Number(after.attempt_count) !== Number(before.attempt_count) + 1) {
    return { ok: false, message: 'Attempt counter did not advance exactly once.' }
  }

  const verdict = String(attempt.verdict || '')
  if (verdict === 'MUTUAL_CHANGE_CONTROL') {
    const ok = attempt.accepted === true
      && Number(attempt.resulting_governance_id) > 0
      && Number(after.active_governance_id) === Number(attempt.resulting_governance_id)
      && Number(after.version_count) === Number(before.version_count) + 1
    return { ok, message: ok ? 'Mutual governance activated and version advanced.' : 'Mutual-governance postcondition mismatch.' }
  }

  if (verdict === 'UNILATERAL_CHANGE_POWER') {
    const ok = attempt.accepted === false
      && Number(attempt.resulting_governance_id) === 0
      && Number(after.active_governance_id) === Number(before.active_governance_id)
      && Number(after.version_count) === Number(before.version_count)
      && Number(after.unilateral_power_blocks) === Number(before.unilateral_power_blocks) + 1
    return { ok, message: ok ? 'Unilateral power blocked without changing active governance.' : 'Unilateral-block postcondition mismatch.' }
  }

  if (verdict === 'OUT_OF_SCOPE_DIRECT_CHANGE') {
    const ok = attempt.accepted === false
      && Number(attempt.resulting_governance_id) === 0
      && Number(after.active_governance_id) === Number(before.active_governance_id)
      && Number(after.version_count) === Number(before.version_count)
      && Number(after.out_of_scope_blocks) === Number(before.out_of_scope_blocks) + 1
    return { ok, message: ok ? 'Direct rewrite blocked outside the governance gate.' : 'Direct-change postcondition mismatch.' }
  }

  return { ok: false, message: `Unexpected semantic verdict: ${verdict || 'missing'}.` }
}

export function verifyRollbackPostcondition(before, after) {
  if (!before || !after) return { ok: false, message: 'Rollback state could not be compared.' }
  const keys = [
    'active_governance_id',
    'active_version',
    'version_count',
    'attempt_count',
    'unilateral_power_blocks',
    'out_of_scope_blocks',
  ]
  const ok = keys.every((key) => String(before[key]) === String(after[key]))
  return { ok, message: ok ? 'Rollback confirmed: protected baseline state is unchanged.' : 'Rollback state changed unexpectedly.' }
}
