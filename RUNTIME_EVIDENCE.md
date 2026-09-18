# Runtime evidence — MutualFrame v1.4

## Status

| Gate | Status | Evidence |
|---|---|---|
| Local Node tests | PASS | Run `npm test` |
| Direct production-contract tests | PASS | 7 tests load `contract/MutualFrame.py` |
| Mutation teeth | PASS | 9/9 removed-control mutations are rejected |
| Production build | PASS | Run `npm run build` |
| Package verifier | PASS | Run `npm run verify` |
| GenVM offline linter | NOT RUN | Tool is not installed in this package environment |
| StudioNet deploy | PASS | Project address `0x00B1cFb4cdd08A09097A5344668E1914031eb96F`; finalized, execution success, consensus accepted |
| Three-wallet runtime | PENDING | No v1.4 transaction hashes yet |
| Deployed-source parity | PASS | Explorer code SHA-256 exactly matches the frozen repository source |
| Calldata probe | PENDING | Requires fresh deployment address |
| Explorer/Chrome smoke | PASS | Address page, code tab, and `get_config()` query opened successfully |
| Frontend deployment | PENDING | Project address is pinned; hosted URL still required |

Observed predeploy failure: a discarded candidate reassigned class-declared `TreeMap` fields inside `__init__`; StudioNet rolled deployment back with `AssertionError: Is right the same storage type? TreeMap <- TreeMap`. Package 1.4.1 removes that reassignment. This failed deployment has no usable contract address and is not runtime proof for v1.4 behavior.

Do not paste evidence from an older source version here. Any source-byte change invalidates deploy and transaction evidence collected for the previous bytes.

## Transaction record template

Copy one row per state-changing call. Do not mark a transaction successful from consensus acceptance alone.

| Step | Wallet/role | Method | Exact arguments | Tx hash | Consensus | Leader execution | Postcondition | Result |
|---|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  | PENDING |

Required execution values are explicit `SUCCESS`/`FINISHED_WITH_RETURN` or `ERROR`/`FINISHED_WITH_ERROR`, followed by a fresh contract read proving the expected state.

## Deployment identity template

| Item | Value |
|---|---|
| Network | StudioNet 61999, API v0.2 |
| Source SHA-256 | `85aa2ace5b9cf1186743e9d710f58e4263709428e8ab690a3b664af33f78dfc1` |
| Intelligent Contract address | DEFERRED — separate submission later |
| Project address | `0x00B1cFb4cdd08A09097A5344668E1914031eb96F` |
| Deploy transaction | `0x1c04094b627353864e3fad9afae4ac70b2cf64ac6615c12c903136ca3c793571` |
| Frontend URL | PENDING |
| Repository/package version | v1.4.1 |

## Source parity template

Record the raw fetched source hash and the LF-normalized hash. Only CRLF/LF conversion and one optional terminal newline may be normalized. Any other mismatch is a failure.

| Check | Repository | Deployed | Result |
|---|---|---|---|
| LF-normalized SHA-256 | `85aa2ace5b9cf1186743e9d710f58e4263709428e8ab690a3b664af33f78dfc1` | `85aa2ace5b9cf1186743e9d710f58e4263709428e8ab690a3b664af33f78dfc1` | PASS |
