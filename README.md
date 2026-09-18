# MutualFrame v1.4

MutualFrame is a StudioNet Intelligent Contract and browser Project for governing changes to an immutable baseline. A semantic verdict is load-bearing: only a genuine mutual-control clause unlocks amendment proposals, and only the baseline's immutable counterparty can make a concrete amendment effective.

## Deployment status

| Item | Value |
|---|---|
| Network | StudioNet, chain ID `61999`, API v0.2 |
| Contract file | `contract/MutualFrame.py` |
| Python class | `UnilateralChangeGuard` |
| Version | `1.4` |
| Package revision | `1.4.1` |
| Frozen LF source SHA-256 | `85aa2ace5b9cf1186743e9d710f58e4263709428e8ab690a3b664af33f78dfc1` |
| Project address | `0x00B1cFb4cdd08A09097A5344668E1914031eb96F` |
| Deploy status | `FINALIZED / SUCCESS / Accepted` |
| Deployed-source parity | **PASS — exact SHA-256 match** |
| Frontend URL | **PENDING — publish this configured build** |

`src/config.js` is pinned to the StudioNet Project deployment above. The Explorer source hashes to the same frozen SHA-256 as `contract/MutualFrame.py`.

## State machine

1. The authority creates a baseline and binds a different counterparty.
2. Only the authority may submit candidate governance clauses.
3. Semantic consensus classifies the clause into one of three closed outcomes.
4. Only mutual change control becomes active; the other two outcomes are logged and blocked.
5. Active governance allows the authority to propose one concrete amendment.
6. Only the immutable counterparty can approve it and advance `effective_version`.
7. A newer accepted governance version makes an older pending amendment stale.

There is no cancel, withdraw, replace, retry, or replay route for a pending or approved amendment.

## Security boundary

- User text is JSON-encoded before it enters the validator prompt.
- Reserved verdict labels and the word `verdict` are rejected deterministically before any model call.
- Cache keys normalize Unicode whitespace and case, and are scoped by `baseline_id`.
- Fresh model calls are capped at 8 per baseline; cache hits do not consume the cap.
- The original `baseline_text` never changes. Approved text is exposed separately as `effective_text`.
- No global administrator and no deployer-only privilege exist.
- This contract has no `emit_transfer` and accepts no native value.

## Browser Project

- `genlayer-js@1.1.8` and `viem` are bundled locally by esbuild; there is no runtime SDK CDN.
- The browser switches to StudioNet `0xf22f` without installing a Snap.
- Every write rechecks the wallet chain.
- Both read and write clients use the same-origin `/api/rpc` proxy.
- Success requires finalization, explicit execution success, and a matching state postcondition.
- Text boxes apply a conservative 150 UTF-8-byte soft guard. The contract cap remains 4,000 characters.

The exact calldata boundary is environment-dependent and has not yet been measured for this deployment. Run `npm run probe:calldata` and record the result before release.

## Local commands

```text
npm ci
npm test
npm run build
npm run verify
npm run dev
```

The Python contract tests are launched through Node and detect `py -3`, `python`, or `python3`, so the same npm command works on Windows CMD and CI.

## Calldata probe

Set `CONTRACT_ADDRESS`, `PROBE_FROM`, `PROBE_COUNTERPARTY`, and optionally `PROBE_BASELINE_ID` before running:

```text
npm run probe:calldata
```

The probe calls `eth_estimateGas` for `create_baseline` and `propose_governance`; it never signs or sends a transaction.

## Honest limitations

- Semantic consensus classifies change-control structure; it does not judge commercial fairness or prove off-chain compliance.
- The deployment, Explorer availability, `get_config()` read, and deployed-source parity are verified. Three-wallet behavioral evidence, calldata limits, and hosted-frontend smoke remain pending.
- Concurrent baseline creation can make the inferred newest ID ambiguous. The UI detects this with before/after counters and reports a postcondition mismatch instead of claiming success.
- The 150-byte frontend guard is conservative until the fresh deployment is probed.

See [TESTING.md](TESTING.md), [RUNTIME_EVIDENCE.md](RUNTIME_EVIDENCE.md), [LOCKED_SPEC.md](LOCKED_SPEC.md), and [SECURITY.md](SECURITY.md).
