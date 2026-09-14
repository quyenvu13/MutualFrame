# MutualFrame

MutualFrame is a GenLayer dApp for registering governance clauses against an immutable baseline obligation while blocking unilateral future-change power and direct duty rewrites.

## Project identity

```text
Project                  MutualFrame
Contract class           UnilateralChangeGuard
Contract version         1.3
Network                  GenLayer StudioNet
Project deployment       0xD106722B17ac4bb888A14a0e14114bD052Ca6105
Frozen source SHA-256    675dcba2f55a34c4682d3f2ea05dae9fcb0d8620ceb620d1a1c13c3fef76e901
```

Explorer:

```text
https://explorer-studio.genlayer.com/address/0xD106722B17ac4bb888A14a0e14114bD052Ca6105
```

Project deploy transaction:

```text
0xb8350999a75a4b34eee3095fdafe7e3f7c0e6f5926e83dff5c7f995aedfd484c
FINALIZED · GenVM SUCCESS · Accepted
```

The Project uses a fresh deployment address. The frozen implementation is kept under the product-facing filename `contract/MutualFrame.py`; the Python class and implementation remain `UnilateralChangeGuard` v1.3.

## What the protocol does

Each baseline records:

- the creating wallet as its immutable authority;
- the immutable baseline text;
- the currently active governance version, if one exists;
- governance-version and attempt counters;
- unilateral-power and direct-rewrite block counters.

Only the baseline authority may call `propose_governance`.

The semantic classifier returns exactly one verdict:

```text
MUTUAL_CHANGE_CONTROL
UNILATERAL_CHANGE_POWER
OUT_OF_SCOPE_DIRECT_CHANGE
```

The contract then applies deterministic consequences:

- `MUTUAL_CHANGE_CONTROL` creates and activates the next governance version;
- `UNILATERAL_CHANGE_POWER` is rejected and increments the unilateral block counter;
- `OUT_OF_SCOPE_DIRECT_CHANGE` is rejected and increments the out-of-scope counter.

Malformed or non-convergent semantic output cannot create an attempt or governance version.

## Frontend

The browser application has five reviewer-facing areas:

1. **Overview** — live configuration, semantic boundary and contract identity.
2. **Create baseline** — empty-form immutable baseline creation.
3. **Governance gate** — baseline inspection and semantic governance proposals.
4. **Attempt log** — paginated on-chain history with cache disclosure.
5. **Verification** — frozen source identity, execution-truth model and exact review path.

The UI distinguishes transaction submission, finalization, execution result, and postcondition verification. If a finalized receipt does not expose execution status, it checks the authoritative leader receipt for up to 60 seconds. If execution still cannot be proven, the UI reports confirmation as delayed and does not present the action as successful.

After a successful write, MutualFrame performs action-specific reads before showing a verified state. After an execution error, it refreshes the baseline and compares protected counters/state to surface rollback evidence.

## Submission logo

`MutualFrame-logo-512.png` is the 512×512 PNG asset intended for the submission form.

## Local development

No frontend dependency install is required. GenLayerJS is loaded in the browser from the pinned `1.1.8` ESM distribution.

```bash
npm run dev
```

Open:

```text
http://localhost:4173
```

The local development server is implemented with Node.js; Python is not required on Windows.

Run the project verifier:

```bash
npm run verify
```

`npm run verify` executes the transaction/postcondition unit tests, creates the production `dist/` bundle, verifies the exact frozen contract SHA-256, checks the pinned Project address, scans package hygiene, and confirms reviewer-facing files are present.

## Vercel

Import the repository as a static project.

```text
Build command: npm run build
Output directory: dist
```

No private key or wallet secret belongs in Vercel. Wallet signing is performed by the user's EIP-1193 browser wallet.

## Honest scope

MutualFrame is a semantic governance registry gate. It does not:

- execute later amendments;
- collect bilateral signatures for a later amendment;
- prove that off-chain parties complied with the registered governance rule;
- decide whether a specific commercial amendment is fair;
- verify external-world facts.

A direct duty rewrite is deliberately treated as `OUT_OF_SCOPE_DIRECT_CHANGE` rather than being mislabeled as a mutual governance mechanism.
