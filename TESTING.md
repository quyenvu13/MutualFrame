# MutualFrame v1.4 testing

## Local gates executed

| Gate | Command | Expected |
|---|---|---|
| Frontend/unit tests | `npm test` | Node tests and direct production-contract tests pass |
| Production bundle | `npm run build` | `dist/assets/main.js` and `dist/assets/styles.css` exist |
| Package audit | `npm run verify` | Tests, build, hash, hygiene, wiring, and docs pass |
| Frozen source | `sha256sum contract/MutualFrame.py` | `85aa2ace5b9cf1186743e9d710f58e4263709428e8ab690a3b664af33f78dfc1` |

The final command outputs are summarized in `RUNTIME_EVIDENCE.md`. StudioNet runtime gates remain separate and must not be marked complete from offline results.

## New blind runtime vectors

These sentences are not embedded as examples in the Intelligent Contract prompt.

| Purpose | Text |
|---|---|
| Baseline | `Museum image files stay downloadable for eighteen months.` |
| One-sided rule | `The archive owner can shorten that period independently; the visitor learns about it afterward.` |
| Two-party rule | `A different schedule begins only when the archive owner and visitor separately confirm it.` |
| Direct rewrite | `Museum image files stay downloadable for six months.` |
| Concrete amendment | `Museum image files stay downloadable for twelve months.` |

Keep every submitted text under the measured calldata limit. Until the probe is run, the UI uses a conservative 150 UTF-8-byte guard.

## Exact runtime path — deployed v1.4 Project

Use three distinct wallets: authority, immutable counterparty, and outsider. Perform one state-changing transaction at a time. Stop immediately on any mismatch.

1. Open Project `0x00B1cFb4cdd08A09097A5344668E1914031eb96F` and call `get_config()`.
   - Verified: version `1.4`, model-call cap `8`, all counters zero.
   - CẦN SNAP: KHÔNG CẦN.
2. Authority calls `create_baseline(baseline, counterparty)`.
   - Expected: baseline #1 binds both wallets, model calls 0, effective version 0.
   - CẦN SNAP: KHÔNG CẦN.
3. Authority calls `propose_amendment(1, concrete_amendment)` before governance.
   - Expected: explicit execution error `Mutual governance is not active`; every protected field unchanged.
   - CẦN SNAP: KHÔNG CẦN.
4. Authority calls `propose_governance(1, one_sided_rule)`.
   - Expected: blocked, attempt +1, unilateral block +1, active governance remains 0.
   - CẦN SNAP: KHÔNG CẦN.
5. Authority calls `propose_governance(1, two_party_rule)`.
   - Expected: accepted, governance version 1 activates.
   - CẦN SNAP: KHÔNG CẦN.
6. Authority repeats `propose_amendment(1, concrete_amendment)`.
   - Expected: same call now succeeds and creates one pending amendment pinned to governance 1/effective version 0.
   - CẦN SNAP: KHÔNG CẦN.
7. Outsider calls `approve_amendment(1, amendment_id)`.
   - Expected: explicit execution error; pending and effective state unchanged.
   - CẦN SNAP: KHÔNG CẦN.
8. Counterparty calls the same `approve_amendment`.
   - Expected: status approved, effective version 1, effective text equals the amendment.
   - CẦN SNAP: KHÔNG CẦN.
9. Authority submits a case/whitespace variant of the one-sided rule.
   - Expected: `used_cache = true`; `model_calls` does not increase.
   - CẦN SNAP: KHÔNG CẦN.
10. Authority submits the direct rewrite vector.
    - Expected: blocked as direct change; active governance/effective text unchanged.
    - CẦN SNAP: KHÔNG CẦN.
11. Create another pending amendment, then accept a newer two-party governance rule.
    - Expected: pending amendment becomes `STALE`; its later approval rolls back.
    - CẦN SNAP: KHÔNG CẦN.
12. Fetch deployed source, normalize only CRLF/LF and one optional terminal newline, and compare SHA-256 with the repository.
    - Expected: exact parity with `SOURCE_SHA256.txt`.
    - CẦN SNAP: KHÔNG CẦN.

For every transaction, record wallet, method, exact arguments, transaction hash, consensus status, leader execution result, and observed postcondition in `RUNTIME_EVIDENCE.md`.

## Calldata boundary

Run the read-only estimator after deployment:

```text
set CONTRACT_ADDRESS=0x...
set PROBE_FROM=0x...
set PROBE_COUNTERPARTY=0x...
npm run probe:calldata
```

The probe must show mixed accepted/rejected lengths for both methods. Record the largest accepted UTF-8 byte length and the first rejected length. It does not sign or send transactions.

## What this run does NOT prove

- Offline stubs do not prove GenVM v0.2 deployment compatibility, TreeMap persistence, or nondeterministic validator behavior.
- Mutation tests prove that local regression gates detect removed controls; they do not replace StudioNet runtime evidence.
- A successful build does not prove MetaMask switching, proxy behavior, explorer availability, or Vercel deployment.
- Repository/deployment byte parity is verified by exact SHA-256 match.
- Until all three wallets execute the path above with hashes, authorization and stale/replay branches are only locally covered.
- The calldata boundary is `PENDING` until `eth_estimateGas` results are captured against the fresh deployment.
