function toInt(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${label} is outside the supported range.`)
  }
  return n
}

export async function loadAttemptHistory(reader, baselineIdInput, fromInput = 1, countInput = 12) {
  const baselineId = toInt(baselineIdInput, 'Baseline ID', { min: 1 })
  const from = toInt(fromInput, 'From attempt', { min: 1 })
  const count = toInt(countInput, 'Count', { min: 1, max: 50 })

  const baseline = await reader.readBaseline(baselineId)
  const total = toInt(baseline?.attempt_count ?? 0, 'Attempt count', { min: 0, max: 100 })

  if (total === 0 || from > total) {
    return { baseline, total, items: [] }
  }

  const last = Math.min(total, from + count - 1)
  const ids = Array.from({ length: last - from + 1 }, (_, index) => from + index)
  const items = await Promise.all(ids.map((attemptId) => reader.readAttempt(baselineId, attemptId)))

  if (items.length !== ids.length) {
    throw new Error(`Attempt history mismatch: expected ${ids.length}, loaded ${items.length}.`)
  }

  items.forEach((attempt, index) => {
    const expectedId = ids[index]
    const returnedBaseline = Number(attempt?.baseline_id)
    const returnedAttempt = Number(attempt?.attempt_id)
    if (returnedBaseline !== baselineId || returnedAttempt !== expectedId) {
      throw new Error(`Attempt history mismatch at #${expectedId}.`)
    }
  })

  return { baseline, total, items }
}
