# Build rules — StudioNet Intelligent Contract + Project

## Intelligent Contract

1. Lock the target first: StudioNet 61999, API v0.2. Do not mix Studio Next APIs.
2. Keep semantic consensus narrow. It may classify an ambiguous fact, but authorization, counters, state transitions, limits, and consequences stay deterministic.
3. Never ship runtime test sentences or labeled answers inside a validator prompt.
4. Make the semantic result load-bearing. An accepted result must unlock or select a consequence that deterministic code actually enforces.
5. Bind every real role on-chain. A single wallet must not be able to create, judge, and complete the entire supposedly mutual flow.
6. Audit every escape path: cancel, withdraw, replace, retry, reroll, replay, stale approval, and post-terminal action.
7. Normalize cache inputs, scope cache identity to the governed object, and cap fresh model calls separately from attempts.
8. Reject prompt-control markers deterministically before calling a model. Encode user input as data and validate model output against a closed set.
9. Use only v0.2-compatible public parameter types. Declare `TreeMap` fields at class level; do not reassign those storage descriptors in `__init__` on the current StudioNet build.
10. If contract bytes change, invalidate old addresses, hashes, transaction evidence, and runtime claims.

## Browser Project

1. Pin `genlayer-js@1.1.8` and bundle it with its dependencies. Do not load the SDK from a runtime CDN.
2. Do not call SDK `connect()` on StudioNet; switch/add chain `0xf22f` directly and do not request a Snap.
3. Recheck the wallet chain before every write because Studio-chain SDK checks may be skipped.
4. Route both reads and writes through a same-origin `/api/rpc` proxy; register the canonical Studio RPC in MetaMask.
5. Treat submission, finalization, execution, and state postcondition as four different gates.
6. Never convert missing execution evidence into success. Show delayed/unknown and prevent duplicate submission.
7. Match cross-language normalization exactly (`pyStrip`, Unicode byte counts, integer conversions).
8. Keep a conservative UI byte guard and ship an `eth_estimateGas` probe; do not reduce the contract's logical text cap to hide transport limits.
9. Keep forms empty. Runtime fixtures belong in test documentation, not production inputs or prompts.
10. A production build is not runtime evidence. Record fresh addresses, hashes, explicit execution outcomes, and postconditions separately.

## Test and submission

1. Load the exact production contract in tests; frontend-only models do not count as contract coverage.
2. Give each repaired bug a regression gate, then mutate/remove that control and confirm the gate fails.
3. Every mutation category must contain meaningful pass/fail discrimination.
4. Mark unavailable gates `NOT RUN`, `PENDING`, or `BLOCKED`; never infer them from nearby checks.
5. Use one state-changing transaction per step and stop on the first mismatch.
6. Every transaction instruction states whether a Snap is needed. For this project: `CẦN SNAP: KHÔNG CẦN`.
7. Keep public docs free of obsolete deployments, private review notes, credentials, local artifacts, and unrelated project addresses.
8. Generate checksums only after the final byte change, then rerun the verifier on the exact package being submitted.
