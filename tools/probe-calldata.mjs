import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'

const RPC = 'https://studio.genlayer.com/api'
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
const FROM = process.env.PROBE_FROM
const COUNTERPARTY = process.env.PROBE_COUNTERPARTY
const BASELINE_ID = Number(process.env.PROBE_BASELINE_ID || 1)
const LENGTHS = String(process.env.PROBE_LENGTHS || '64,96,120,140,150,160,180')
  .split(',').map(Number).filter((value) => Number.isInteger(value) && value > 0)

if (!/^0x[0-9a-fA-F]{40}$/.test(CONTRACT_ADDRESS || '')) throw new Error('Set CONTRACT_ADDRESS to the fresh v1.4 Project address.')
if (!/^0x[0-9a-fA-F]{40}$/.test(FROM || '')) throw new Error('Set PROBE_FROM to the authority address. No signature is requested.')
if (!/^0x[0-9a-fA-F]{40}$/.test(COUNTERPARTY || '')) throw new Error('Set PROBE_COUNTERPARTY to a different address.')

const realFetch = globalThis.fetch
let capturedEstimate = null
globalThis.fetch = async (input, init = {}) => {
  const request = JSON.parse(String(init.body || '{}'))
  const response = await realFetch(input, {
    ...init,
    headers: {
      ...init.headers,
      accept: 'application/json, text/plain, */*',
      'user-agent': 'Mozilla/5.0 MutualFrame-Calldata-Probe/1.4',
      origin: 'https://studio.genlayer.com',
      referer: 'https://studio.genlayer.com/',
    },
  })
  const body = await response.text()
  if (request.method === 'eth_estimateGas') {
    const parsed = JSON.parse(body)
    capturedEstimate = parsed.error
      ? { ok: false, error: parsed.error.message || JSON.stringify(parsed.error) }
      : { ok: true, gas: parsed.result }
  }
  return new Response(body, { status: response.status, headers: response.headers })
}

const provider = {
  async request({ method }) {
    if (method === 'eth_sendTransaction') throw new Error('PROBE_COMPLETE_NO_TRANSACTION_SENT')
    if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [FROM]
    throw new Error(`Unexpected wallet method: ${method}`)
  },
}

const chain = {
  ...studionet,
  rpcUrls: {
    ...studionet.rpcUrls,
    default: { http: [RPC] },
    public: { http: [RPC] },
  },
}
const client = createClient({ chain, account: FROM, provider })

async function estimate(functionName, args) {
  capturedEstimate = null
  try {
    await client.writeContract({ address: CONTRACT_ADDRESS, functionName, args, value: 0n })
  } catch (error) {
    if (!String(error?.message || error).includes('PROBE_COMPLETE_NO_TRANSACTION_SENT')) throw error
  }
  return capturedEstimate || { ok: false, error: 'SDK did not issue eth_estimateGas.' }
}

const rows = []
for (const length of LENGTHS) {
  const text = 'A'.repeat(length)
  rows.push({ method: 'create_baseline', textBytes: length, ...await estimate('create_baseline', [text, COUNTERPARTY]) })
  rows.push({ method: 'propose_governance', textBytes: length, ...await estimate('propose_governance', [BASELINE_ID, text]) })
}

console.table(rows)
console.log('No transaction was signed or sent. Record the largest accepted length in README.md and TESTING.md.')
