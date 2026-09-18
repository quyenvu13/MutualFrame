# Runtime evidence — MutualFrame v1.4

## Status

| Gate | Status | Evidence |
|---|---|---|
| Local Node tests | PASS | 28/28 tracked Node tests |
| Direct production-contract tests | PASS | 7/7 tests load `contract/MutualFrame.py` |
| Mutation teeth | PASS | 9/9 removed-control mutations are rejected |
| Production build | PASS | Run `npm run build` |
| Package verifier | PASS | Run `npm run verify` |
| GenVM offline linter | NOT RUN | Tool is not installed in this package environment |
| StudioNet deploy | PASS | Project address `0x00B1cFb4cdd08A09097A5344668E1914031eb96F`; finalized, execution success, consensus accepted |
| Load-bearing browser runtime | PASS | Fresh baseline #1; unilateral attempt blocked; mutual rule activated; amendment proposed and approved by the immutable counterparty |
| Extended adversarial runtime | NOT RUN | Outsider, cache-variant and stale/replay paths remain unclaimed on StudioNet; tracked direct production-contract tests cover them locally |
| Deployed-source parity | PASS | Explorer code SHA-256 exactly matches the frozen repository source |
| Calldata probe | PENDING | Requires fresh deployment address |
| Explorer/Chrome smoke | PASS | Address page, code tab, and `get_config()` query opened successfully |
| Frontend deployment | PASS | `https://mutual-frame.vercel.app/` reads and writes against the pinned Project address |

Observed predeploy failure: a discarded candidate reassigned class-declared `TreeMap` fields inside `__init__`; StudioNet rolled deployment back with `AssertionError: Is right the same storage type? TreeMap <- TreeMap`. Package 1.4.1 removes that reassignment. This failed deployment has no usable contract address and is not runtime proof for v1.4 behavior.

Do not paste evidence from an older source version here. Any source-byte change invalidates deploy and transaction evidence collected for the previous bytes.

## Observed live postconditions

The browser waited for authoritative execution evidence and then re-read contract state before showing each green result. The StudioNet Explorer address history is the transaction source of record.

| Step | Role | Method | Postcondition | Result |
|---|---|---|---|---|
| 1 | Authority | `create_baseline` | Baseline #1 exists with immutable authority/counterparty and zeroed governance state | PASS |
| 2 | Authority | `propose_governance` | Attempt #1 is `UNILATERAL_CHANGE_POWER`, fresh, blocked; active governance remains v0 | PASS |
| 3 | Authority | `propose_governance` | Attempt #2 is `MUTUAL_CHANGE_CONTROL`, fresh, activated; governance advances to v1 | PASS |
| 4 | Authority | `propose_amendment` | Amendment #1 is pending and pinned to governance v1/effective v0 | PASS |
| 5 | Counterparty | `approve_amendment` | Effective version advances exactly once to v1; original text remains immutable | PASS |

Final live counters are `1 baseline / 1 governance rule / 1 amendment`. The audit surface returns the two attempts above in append-only order. Consensus acceptance alone was not used as proof.

## Deployment identity template

| Item | Value |
|---|---|
| Network | StudioNet 61999, API v0.2 |
| Source SHA-256 | `85aa2ace5b9cf1186743e9d710f58e4263709428e8ab690a3b664af33f78dfc1` |
| Intelligent Contract address | DEFERRED — separate submission later |
| Project address | `0x00B1cFb4cdd08A09097A5344668E1914031eb96F` |
| Deploy transaction | `0x1c04094b627353864e3fad9afae4ac70b2cf64ac6615c12c903136ca3c793571` |
| Frontend URL | `https://mutual-frame.vercel.app/` |
| Repository/package version | v1.4.1 |

## Source parity template

Record the raw fetched source hash and the LF-normalized hash. Only CRLF/LF conversion and one optional terminal newline may be normalized. Any other mismatch is a failure.

| Check | Repository | Deployed | Result |
|---|---|---|---|
| LF-normalized SHA-256 | `85aa2ace5b9cf1186743e9d710f58e4263709428e8ab690a3b664af33f78dfc1` | `85aa2ace5b9cf1186743e9d710f58e4263709428e8ab690a3b664af33f78dfc1` | PASS |
