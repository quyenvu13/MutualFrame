import {
  CONTRACT_ADDRESS,
  CONTRACT_EXPLORER_URL,
  EXPLORER_BASE,
} from './config.js'
import {
  executionOutcome,
  rollbackReason,
} from './tx-truth.js'

let modulesPromise
let readClientPromise

async function loadSdk() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import('https://esm.unpkg.com/genlayer-js@1.1.8'),
      import('https://esm.unpkg.com/genlayer-js@1.1.8/chains'),
      import('https://esm.unpkg.com/genlayer-js@1.1.8/types'),
    ]).then(([sdk, chains, types]) => ({ sdk, chains, types }))
  }
  return modulesPromise
}

async function getReadClient() {
  if (!readClientPromise) {
    readClientPromise = loadSdk().then(({ sdk, chains }) => sdk.createClient({ chain: chains.studionet }))
  }
  return readClientPromise
}

export function shortAddress(value, left = 6, right = 4) {
  if (!value) return '—'
  if (value.length <= left + right + 3) return value
  return `${value.slice(0, left)}…${value.slice(-right)}`
}

export function txExplorerUrl(hash) {
  return `${EXPLORER_BASE}/tx/${hash}`
}

export function contractExplorerUrl() {
  return CONTRACT_EXPLORER_URL
}

export function cleanError(error) {
  const text = String(error?.shortMessage || error?.message || error || 'Unknown error')
  return text
    .replace(/^Error:\s*/i, '')
    .replace(/\n\s*Details:[\s\S]*$/i, '')
    .trim()
}

export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask was not detected in this browser.')
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  const account = accounts?.[0]
  if (!account) throw new Error('No wallet account was returned.')

  const { sdk, chains } = await loadSdk()
  const client = sdk.createClient({
    chain: chains.studionet,
    account,
    provider: window.ethereum,
  })
  await client.connect('studionet')
  return { account, client }
}

export async function currentWallet() {
  if (!window.ethereum) return null
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  return accounts?.[0] || null
}

async function read(functionName, args = []) {
  const client = await getReadClient()
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    stateStatus: 'accepted',
  })
}

export const readConfig = () => read('get_config')
export const readBaseline = (baselineId) => read('get_baseline', [Number(baselineId)])
export const readGovernance = (governanceId) => read('get_governance', [Number(governanceId)])
export const readAttempt = (baselineId, attemptId) => read('get_attempt', [Number(baselineId), Number(attemptId)])

export function normalizeListResult(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  for (const key of ['result', 'data', 'returnValue', 'return_value']) {
    if (value && Object.hasOwn(value, key)) {
      const normalized = normalizeListResult(value[key])
      if (normalized) return normalized
    }
  }
  return null
}

export async function readAttempts(baselineId, fromId, count) {
  const bid = Number(baselineId)
  const start = Number(fromId)
  const requested = Number(count)
  const baseline = await readBaseline(bid)
  const total = Number(baseline?.attempt_count || 0)
  if (!Number.isFinite(start) || !Number.isFinite(requested) || start <= 0 || requested <= 0 || start > total) return []

  const expected = Math.min(requested, total - start + 1)

  try {
    const bulkRaw = await read('get_attempts', [bid, start, requested])
    const bulk = normalizeListResult(bulkRaw)
    if (Array.isArray(bulk) && bulk.length === expected) return bulk
  } catch {
    // Some StudioNet/SDK combinations do not surface list-return view methods reliably.
    // Fall through to exact per-attempt reads, which use the same authoritative state.
  }

  const rows = []
  for (let attemptId = start; attemptId < start + expected; attemptId += 1) {
    rows.push(await readAttempt(bid, attemptId))
  }
  return rows
}

async function estimateFees(client, call) {
  if (typeof client.estimateTransactionFeesForWrite !== 'function') return null
  try {
    const estimate = await client.estimateTransactionFeesForWrite(call)
    if (!estimate?.distribution || estimate?.feeValue == null) return null
    return {
      distribution: estimate.distribution,
      feeValue: estimate.feeValue,
    }
  } catch {
    return null
  }
}

export async function submitWrite(client, functionName, args = []) {
  const call = {
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value: 0n,
  }
  const fees = await estimateFees(client, call)
  return client.writeContract(fees ? { ...call, fees } : call)
}

async function finalizedReceipt(hash) {
  const client = await getReadClient()
  const { types } = await loadSdk()

  if (typeof client.waitForTransactionReceipt === 'function' && types?.TransactionStatus?.FINALIZED != null) {
    return client.waitForTransactionReceipt({
      hash,
      status: types.TransactionStatus.FINALIZED,
      interval: 5000,
      retries: 240,
      fullTransaction: true,
    })
  }

  if (typeof client.waitForFinalization === 'function') {
    return client.waitForFinalization({ hash })
  }

  throw new Error('This GenLayerJS version does not expose a finalization waiter.')
}

async function getTransaction(hash) {
  const client = await getReadClient()
  if (typeof client.getTransaction !== 'function') return null
  try {
    return await client.getTransaction({ hash })
  } catch {
    return null
  }
}

export async function waitForAuthoritativeExecution(hash, onProgress = () => {}) {
  onProgress({ phase: 'finalizing', message: 'Waiting for consensus finalization…' })
  const receipt = await finalizedReceipt(hash)

  let outcome = executionOutcome(receipt)
  if (outcome.ok !== null) {
    return { receipt, transaction: null, outcome, reason: outcome.ok ? '' : rollbackReason(receipt) }
  }

  onProgress({ phase: 'execution', message: 'Finalized. Checking authoritative leader execution…' })

  const started = Date.now()
  let transaction = null
  while (Date.now() - started < 60_000) {
    transaction = await getTransaction(hash)
    outcome = executionOutcome(receipt, transaction)
    if (outcome.ok !== null) {
      return {
        receipt,
        transaction,
        outcome,
        reason: outcome.ok ? '' : rollbackReason(transaction || receipt),
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  return {
    receipt,
    transaction,
    outcome: { ok: null, name: 'EXECUTION_RESULT_UNAVAILABLE', evidence: 'NONE' },
    reason: 'Confirmation is delayed. Do not resubmit this transaction until its execution result is known.',
  }
}
