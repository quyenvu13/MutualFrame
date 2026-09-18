import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const expectedHash = '85aa2ace5b9cf1186743e9d710f58e4263709428e8ab690a3b664af33f78dfc1'
const zeroAddress = '0x0000000000000000000000000000000000000000'
const projectAddress = '0x00B1cFb4cdd08A09097A5344668E1914031eb96F'
const deployTx = '1c04094b627353864e3fad9afae4ac70b2cf64ac6615c12c903136ca3c793571'

const required = [
  '.github/workflows/verify.yml',
  'README.md', 'TESTING.md', 'RUNTIME_EVIDENCE.md', 'LOCKED_SPEC.md',
  'BUILD_RULES.md', 'BLIND_RUNTIME_PROTOCOL.md', 'SOURCE_SHA256.txt',
  'CHANGELOG.md', 'SECURITY.md', 'MUTATION_MATRIX.md', 'FINAL_CHECKSUMS.txt',
  'index.html', 'package.json', 'package-lock.json', 'vercel.json',
  'MutualFrame-logo-512.png', 'contract/MutualFrame.py',
  'src/config.js', 'src/main.js', 'src/genlayer.js', 'src/audit-history.js',
  'src/tx-truth.js', 'src/text-boundary.js', 'src/styles.css',
  'scripts/build.mjs', 'scripts/serve.mjs', 'scripts/run-python-tests.mjs',
  'tools/probe-calldata.mjs',
  'tests/contract-direct/test_mutualframe_contract.py',
  'tests/contract-regression.test.mjs',
  'dist/index.html', 'dist/assets/main.js', 'dist/assets/styles.css',
]

for (const path of required) {
  await stat(resolve(root, path)).catch(() => { throw new Error(`Missing required file: ${path}`) })
}

const contract = await readFile(resolve(root, 'contract/MutualFrame.py'))
const actualHash = createHash('sha256').update(contract).digest('hex')
if (actualHash !== expectedHash) throw new Error(`Frozen source hash mismatch: ${actualHash}`)

const sourceHashText = await readFile(resolve(root, 'SOURCE_SHA256.txt'), 'utf8')
if (!sourceHashText.includes(`${expectedHash}  contract/MutualFrame.py`)) throw new Error('SOURCE_SHA256.txt is not pinned to the frozen contract.')

const configText = await readFile(resolve(root, 'src/config.js'), 'utf8')
if (!configText.includes(`CONTRACT_VERSION = '1.4'`)) throw new Error('Contract version is not pinned to 1.4.')
if (!configText.includes(expectedHash)) throw new Error('src/config.js does not pin the frozen source hash.')
const address = configText.match(/CONTRACT_ADDRESS\s*=\s*'(0x[0-9a-fA-F]{40})'/)?.[1]
if (!address) throw new Error('src/config.js has no valid Project address.')
if (address.toLowerCase() !== projectAddress.toLowerCase()) throw new Error('src/config.js is not pinned to the verified StudioNet Project address.')
if (address === zeroAddress) {
  const readme = await readFile(resolve(root, 'README.md'), 'utf8')
  if (!readme.includes('Fresh Project address | **PENDING')) throw new Error('Zero-address predeploy sentinel is not disclosed in README.md.')
}

async function walk(dir) {
  const out = []
  for (const name of await readdir(dir)) {
    if (['.git', 'dist', 'node_modules', '__pycache__'].includes(name)) continue
    const full = resolve(dir, name)
    const info = await stat(full)
    if (info.isDirectory()) out.push(...await walk(full))
    else out.push(full)
  }
  return out
}

const staleFragments = [['esm.unpkg.com', 'genlayer-js'].join('/')]
for (const file of await walk(root)) {
  const rel = relative(root, file).replaceAll('\\', '/')
  const lowerName = rel.toLowerCase()
  if (lowerName.includes('.env.local') || lowerName.endsWith('.zip') || lowerName.endsWith('.pyc')) throw new Error(`Package hygiene failure: ${rel}`)
  const bytes = await readFile(file)
  const raw = bytes.toString('latin1').toLowerCase()
  for (const fragment of staleFragments) {
    if (raw.includes(fragment)) throw new Error(`Stale deployment/CDN evidence found in ${rel}`)
  }
  const text = bytes.toString('utf8')
  const addresses = text.match(/\b0x[0-9a-fA-F]{40}\b/g) || []
  for (const found of addresses) {
    if (![zeroAddress.toLowerCase(), address.toLowerCase()].includes(found.toLowerCase())) throw new Error(`Unrelated Project/contract address found in ${rel}`)
  }
  if (rel !== 'FINAL_CHECKSUMS.txt') {
    const hashes = text.match(/\b[0-9a-f]{64}\b/g) || []
    for (const found of hashes) {
      if (![expectedHash, deployTx].includes(found)) throw new Error(`Obsolete or unrelated SHA-256/transaction hash found in ${rel}`)
    }
  }
}

const checksumLines = (await readFile(resolve(root, 'FINAL_CHECKSUMS.txt'), 'utf8')).trim().split(/\r?\n/)
for (const line of checksumLines) {
  const match = line.match(/^([0-9a-f]{64})  \.\/(.+)$/)
  if (!match) throw new Error(`Malformed checksum line: ${line}`)
  const bytes = await readFile(resolve(root, match[2]))
  const digest = createHash('sha256').update(bytes).digest('hex')
  if (digest !== match[1]) throw new Error(`Checksum mismatch: ${match[2]}`)
}

const mainText = await readFile(resolve(root, 'src/main.js'), 'utf8')
for (const marker of ['readAmendment', 'handleProposeAmendment', 'handleApproveAmendment', 'assertTextBudget', 'pyStrip', 'waitForAuthoritativeExecution']) {
  if (!mainText.includes(marker)) throw new Error(`Frontend wiring is missing ${marker}.`)
}
if (!mainText.includes('#auditLoadButton') || !mainText.includes('loadAttemptHistory')) throw new Error('Attempt-log UI is not wired to the direct audit-history loader.')

const genlayerText = await readFile(resolve(root, 'src/genlayer.js'), 'utf8')
for (const marker of ['ensureStudioNet', "await ensureStudioNet()", "`${origin}/api/rpc`", "stateStatus: 'accepted'"]) {
  if (!genlayerText.includes(marker)) throw new Error(`StudioNet client wiring is missing ${marker}.`)
}
if (genlayerText.includes('.connect(') || genlayerText.includes('wallet_getSnaps') || genlayerText.includes('wallet_requestSnaps')) throw new Error('Snap-dependent connection code is present.')
if (genlayerText.includes('estimateTransactionFeesForWrite')) throw new Error('Unsupported genlayer-js 2.x fee API is present.')

const vercelText = await readFile(resolve(root, 'vercel.json'), 'utf8')
if (!vercelText.includes('"source": "/api/rpc"') || !vercelText.includes('https://studio.genlayer.com/api')) throw new Error('Same-origin RPC rewrite is missing.')

const contractText = contract.toString('utf8')
for (const marker of ['MAX_MODEL_CALLS_PER_BASELINE = 8', 'def propose_amendment(', 'def approve_amendment(', 'casefold()', '"verdict"']) {
  if (!contractText.includes(marker)) throw new Error(`Contract invariant is missing ${marker}.`)
}
for (const name of ['baselines', 'governance', 'attempts', 'amendments', 'verdict_cache']) {
  if (contractText.includes(`self.${name} = TreeMap()`)) throw new Error(`Class-declared TreeMap is reassigned in __init__: ${name}.`)
}
if (/\bEXAMPLE\b/i.test(contractText)) throw new Error('Labeled prompt examples are present in the contract.')

const distMain = await readFile(resolve(root, 'dist/assets/main.js'), 'utf8')
if (distMain.includes('esm.unpkg.com') || distMain.includes('from"viem"') || distMain.includes("from'viem'")) throw new Error('Production bundle retains a runtime SDK dependency.')

console.log(`PASS frozen contract SHA-256 ${actualHash}`)
console.log(`PASS Project address mode ${address === zeroAddress ? 'PREDEPLOY_SENTINEL' : address}`)
console.log('PASS StudioNet frontend wiring, amendment consequence, and package hygiene')
console.log(`PASS ${required.length} reviewer-facing files/build artifacts`)
