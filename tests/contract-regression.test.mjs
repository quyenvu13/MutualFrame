import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../contract/MutualFrame.py', import.meta.url), 'utf8')

function contractGate(value) {
  const checks = {
    noLabeledExamples: !/EXAMPLE\s+1|24\/7 critical incident|support scope/i.test(value),
    injectionPrefilter: value.includes('Input contains reserved semantic-control text'),
    normalizedCache: value.includes('" ".join(text.split()).casefold()'),
    modelCallCap: value.includes('MAX_MODEL_CALLS_PER_BASELINE = 8'),
    baselineScopedCache: value.includes('str(int(baseline_id)) + "|"'),
    counterpartyBound: value.includes('counterparty: str'),
    amendmentTeeth: value.includes('def propose_amendment(') && value.includes('def approve_amendment('),
    classDeclaredTreeMapsNotReassigned: ['baselines', 'governance', 'attempts', 'amendments', 'verdict_cache'].every((name) => !value.includes(`self.${name} = TreeMap()`)),
    versionPinned: value.includes('Amendment governance version is stale') && value.includes('Amendment effective version is stale'),
  }
  return { checks, ok: Object.values(checks).every(Boolean) }
}

test('v1.4 contract satisfies every regression gate', () => {
  const result = contractGate(source)
  assert.equal(result.ok, true, JSON.stringify(result.checks))
})

const mutations = [
  ['labeled examples return', `${source}\nEXAMPLE 1 — leaked test answer`],
  ['injection prefilter removed', source.replace('Input contains reserved semantic-control text', 'Unfiltered input')],
  ['whitespace normalization weakened', source.replace('" ".join(text.split()).casefold()', 'text.strip()')],
  ['model-call cap inflated', source.replace('MAX_MODEL_CALLS_PER_BASELINE = 8', 'MAX_MODEL_CALLS_PER_BASELINE = 100')],
  ['baseline cache scope removed', source.replace('str(int(baseline_id)) + "|"', '"global|"')],
  ['counterparty removed', source.replace('counterparty: str', 'counterparty_removed: str')],
  ['amendment consequence removed', source.replace('def approve_amendment(', 'def approve_removed(')],
  ['version pin removed', source.replace('Amendment governance version is stale', 'Governance changed')],
  ['TreeMap reassignment returns', source.replace('self.amendment_counter = u256(0)', 'self.amendment_counter = u256(0)\n        self.governance = TreeMap()')],
]

for (const [label, mutated] of mutations) {
  test(`mutation gate rejects: ${label}`, () => {
    const result = contractGate(mutated)
    assert.equal(result.ok, false, `${label} unexpectedly passed all gates`)
    assert.ok(Object.values(result.checks).includes(false))
  })
}
