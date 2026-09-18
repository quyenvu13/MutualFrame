# Security

## Reportable issues

Report authorization bypass, stale/replay acceptance, cache-scope errors, prompt-control bypass, false-success UI states, or deployed-source mismatch before public disclosure. Do not include private keys, seed phrases, or wallet-export files in a report.

## Security model

- Original baseline text is immutable.
- Authority and counterparty are distinct and fixed per baseline.
- Semantic consensus can activate only a governance record; deterministic code controls who may propose or approve amendments.
- Concrete amendments are pinned to current governance and effective version.
- Every user input reaching semantic consensus passes deterministic marker rejection and JSON encoding.
- Fresh semantic calls are bounded independently from total attempts.
- Browser success requires explicit execution evidence and postcondition proof.

## Regression coverage

- `tests/contract-direct/test_mutualframe_contract.py` loads the production contract and exercises role binding, injection rejection, cache normalization, model cap, load-bearing amendments, outsider guards, stale governance, replay resistance, and absence of cancel/withdraw/replace methods.
- `tests/contract-regression.test.mjs` checks source invariants, including the ban on reassigning class-declared TreeMaps, and removes each repaired control to prove the gate rejects the mutation.
- `tests/tx-truth.test.mjs` verifies execution evidence, rollback fields, and amendment postconditions.
- `tests/text-boundary.test.mjs` verifies Python-compatible strip behavior and UTF-8 counting.

## Remaining runtime risk

GenVM deployment, TreeMap persistence, validator behavior, calldata transport boundary, MetaMask chain switching, RPC proxy behavior, and deployed-source parity require the fresh StudioNet deployment. Their status is tracked in `RUNTIME_EVIDENCE.md` and must remain `PENDING` until evidence exists.
