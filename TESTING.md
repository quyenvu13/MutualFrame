# MutualFrame — Testing

## Frozen Project identity

```text
Project                  MutualFrame
Contract class           UnilateralChangeGuard
Version                  1.3
Network                  GenLayer StudioNet
Project address          0xD106722B17ac4bb888A14a0e14114bD052Ca6105
Frozen source SHA-256    675dcba2f55a34c4682d3f2ea05dae9fcb0d8620ceb620d1a1c13c3fef76e901
```

Explorer:

```text
https://explorer-studio.genlayer.com/address/0xD106722B17ac4bb888A14a0e14114bD052Ca6105
```

Deployment evidence:

```text
Tx: 0xb8350999a75a4b34eee3095fdafe7e3f7c0e6f5926e83dff5c7f995aedfd484c
Status: FINALIZED
GenVM Result: SUCCESS
Consensus Result: Accepted
```

## Executed local gates

Run:

```bash
npm run verify
```

The verifier executes:

```text
transaction execution-truth parsing tests
proposal postcondition tests for all 3 semantic verdicts
rollback/no-write comparison test
production static bundle build
frozen source SHA-256 check
Project-address pin check
public-package hygiene scan
reviewer-facing file presence check
```

The frontend forms are empty by default. No demo transaction payload is prefilled.

## Project-deployment runtime status

The fresh Project deployment is externally visible with a successful finalized deploy transaction.

A local-browser smoke run was also executed against `0xD106...6105` with a connected StudioNet wallet:

```text
wallet connection                    observed
baseline #1 creation                 observed
baseline_count                       1
mutual governance proposal           observed
active_version                       1
attempt_count                        1
governance_count                     1
active governance text               matched the submitted mutual-control clause
```

This is **Project frontend smoke evidence**, not a complete address-specific transaction archive. The write transaction hashes were not added to this package, and the remaining unilateral/direct-rewrite/cache/outsider paths below have not been rerun on the Project address. Full contract behavioral coverage was executed on the separately submitted Intelligent Contract deployment, but that evidence is not substituted for Project-address proof.

Byte-level deployed-source parity is also **PENDING** until independently re-fetched from the deployed Project instance.

## Exact runtime path for Project verification

Use the fresh Project deployment only.

### 1 — Read config

Call `get_config()` or load the app Overview.

Expected:

```text
name = UnilateralChangeGuard
version = 1.3
semantic verdicts =
  MUTUAL_CHANGE_CONTROL
  UNILATERAL_CHANGE_POWER
  OUT_OF_SCOPE_DIRECT_CHANGE
max_governance_versions = 20
max_attempts_per_baseline = 100
```

### 2 — Create baseline

Connect Wallet 1 and create:

```text
Service includes 24/7 critical incident support.
```

Expected post-state for the new baseline:

```text
active_governance_id = 0
active_version = 0
version_count = 0
attempt_count = 0
unilateral_power_blocks = 0
out_of_scope_blocks = 0
```

### 3 — Block unilateral future power

Wallet 1 proposes:

```text
The Provider may adjust the support scope to reflect operational changes and notify the customer after the new scope is applied.
```

Expected:

```text
verdict = UNILATERAL_CHANGE_POWER
accepted = false
resulting_governance_id = 0
used_cache = false
```

Active governance must remain unset.

### 4 — Activate mutual change control

Wallet 1 proposes:

```text
A revised support scope takes effect only after both parties record approval of the new version.
```

Expected:

```text
verdict = MUTUAL_CHANGE_CONTROL
accepted = true
resulting_governance_id > 0
active_version = 1
version_count = 1
```

### 5 — Block direct rewrite

Wallet 1 proposes:

```text
24/7 support applies only to Enterprise customers.
```

Expected:

```text
verdict = OUT_OF_SCOPE_DIRECT_CHANGE
accepted = false
resulting_governance_id = 0
```

The mutual governance version from step 4 must remain active.

### 6 — Cache hit

Submit the exact step-3 unilateral candidate again.

Expected latest attempt:

```text
verdict = UNILATERAL_CHANGE_POWER
accepted = false
used_cache = true
```

### 7 — Outsider rollback

Switch to Wallet 2, which is not the baseline authority, and call `propose_governance` for the same baseline.

Expected execution:

```text
ERROR / rollback
Only the baseline authority may propose governance
```

Read the baseline again. `attempt_count`, active governance, version count and both block counters must be unchanged from their pre-transaction values.

## Frontend verification

After deployment to Vercel, check:

```text
[ ] page loads without stale/demo data
[ ] Project address is 0xD106722B17ac4bb888A14a0e14114bD052Ca6105
[ ] get_config reads v1.3
[ ] wallet connect/switch works on StudioNet
[ ] create form starts empty
[ ] governance form starts empty
[ ] submitted/pending state is not shown as success
[ ] success appears only after execution + postcondition proof
[ ] expected rollback refreshes and proves unchanged baseline state
[ ] Attempt log shows accepted/blocked and used_cache correctly
[ ] mobile layout remains usable
[ ] Explorer links resolve to the Project deployment/transactions
```

## Evidence discipline

For every successful Project transaction retain:

```text
full tx hash
caller wallet/role
method + exact parameters
consensus/finalization state
explicit execution result or leader-receipt evidence
post-transaction contract reads
expected vs actual postcondition
```

For every expected rollback retain the execution error/reason plus a post-rollback read proving the protected baseline state is unchanged.
