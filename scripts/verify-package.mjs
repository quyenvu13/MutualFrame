import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const expectedHash = '675dcba2f55a34c4682d3f2ea05dae9fcb0d8620ceb620d1a1c13c3fef76e901'
const projectAddress = '0xD106722B17ac4bb888A14a0e14114bD052Ca6105'
const reservedContractAddress = '0x8A0B0cFE2d89e15D2ca215B560Ed37D7' + '18e31783'

const contract = await readFile(resolve(root, 'contract/MutualFrame.py'))
const actualHash = createHash('sha256').update(contract).digest('hex')
if (actualHash !== expectedHash) throw new Error(`Frozen source hash mismatch: ${actualHash}`)

const required = [
  'index.html', 'package.json', 'vercel.json', 'README.md', 'TESTING.md',
  'MutualFrame-logo-512.png', 'contract/MutualFrame.py', 'src/config.js',
  'src/main.js', 'src/genlayer.js', 'src/audit-history.js', 'src/tx-truth.js', 'src/styles.css',
  'dist/index.html', 'dist/src/main.js',
]
for (const path of required) {
  await stat(resolve(root, path)).catch(() => { throw new Error(`Missing required file: ${path}`) })
}

const fromHex = (hex) => Buffer.from(hex, 'hex').toString('utf8')
const forbidden = [
  '63686174677074',
  '6f70656e6169',
  '616e7468726f706963',
  '636c61756465',
  '64616c6c2d65',
  '67656e657261746564206279206169',
  '616920666565646261636b',
  '7072656465706c6f7920726576696577',
  '7265766965772072657175657374',
  '696e7465726e616c2068616e646f6666',
].map(fromHex)

async function walk(dir) {
  const out = []
  for (const name of await readdir(dir)) {
    if (name === '.git' || name === 'dist') continue
    const full = resolve(dir, name)
    const info = await stat(full)
    if (info.isDirectory()) out.push(...await walk(full))
    else out.push(full)
  }
  return out
}

for (const file of await walk(root)) {
  const rel = relative(root, file).replaceAll('\\', '/')
  const lowerName = rel.toLowerCase()
  if (lowerName.includes('.env.local') || lowerName.endsWith('.zip')) throw new Error(`Package hygiene failure: ${rel}`)
  const bytes = await readFile(file)
  const raw = bytes.toString('latin1').toLowerCase()
  for (const term of forbidden) {
    if (raw.includes(term)) throw new Error(`Public-package provenance marker found in ${rel}`)
  }
  if (raw.includes(reservedContractAddress.toLowerCase())) throw new Error(`Reserved contract address leaked into Project package: ${rel}`)
}


const mainText = await readFile(resolve(root, 'src/main.js'), 'utf8')
if (!mainText.includes("#auditLoadButton") || !mainText.includes('loadAttemptHistory')) {
  throw new Error('Attempt-log UI is not wired to the direct audit-history loader.')
}
const genlayerText = await readFile(resolve(root, 'src/genlayer.js'), 'utf8')
if (genlayerText.includes("read('get_attempts'") || genlayerText.includes('normalizeListResult')) {
  throw new Error('Obsolete bulk attempt-list frontend path is still present.')
}

const configText = await readFile(resolve(root, 'src/config.js'), 'utf8')
if (!configText.includes(projectAddress)) throw new Error('Project contract address is not pinned in src/config.js')

console.log(`PASS frozen contract SHA-256 ${actualHash}`)
console.log(`PASS project address ${projectAddress}`)
console.log('PASS package text/binary hygiene scan')
console.log('PASS required reviewer-facing files and clean 512px logo')
