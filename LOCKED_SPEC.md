# Locked specification — MutualFrame v1.4

These invariants are release locks. A later change must not weaken them without a version bump, new tests, a new source hash, a fresh deployment, and new runtime evidence.

## Network and API

- StudioNet only: chain ID 61999, API v0.2, `genlayer-js` 1.1.8.
- Public method parameters remain `str`, `int`, or `bool`.
- Storage counters use `u256`. `TreeMap` fields are declared at class level and must not be reassigned in `__init__`; StudioNet creates their storage descriptors from those declarations.
- No native-value path and no `emit_transfer`.

## Authority

- Baseline authority is the wallet that creates the baseline.
- Counterparty is supplied at creation, nonzero, different from authority, immutable, and never hardcoded.
- Only authority may propose governance and concrete amendments.
- Only the immutable counterparty may approve a concrete amendment.
- No global admin, deployer override, cancel, withdraw, replace, retry, or replay escape path.

## Semantic boundary

- The model performs only the closed three-outcome classification defined in the contract.
- The prompt contains no labeled example or runtime test vector.
- Reserved output labels and `verdict` in user text are rejected before any model call.
- Only a mutual-control outcome creates active governance.
- One-sided control and direct rewrite outcomes are logged and blocked.

## Reroll controls

- Cache normalization collapses all whitespace runs and applies `casefold()`.
- Cache keys include the immutable `baseline_id`; they are not global and not wallet-scoped.
- `model_calls` increments only for fresh semantic evaluation and is capped at 8 per baseline.
- `attempt_count` remains separately capped at 100.

## Amendment consequence

- `propose_amendment` fails unless active mutual governance exists.
- A pending amendment is pinned to both `active_governance_id` and `effective_version`.
- Proposal does not mutate original or effective text.
- Approval advances `effective_version` exactly once and records the approving counterparty.
- A newer accepted governance version marks an older pending amendment stale.
- Approved/stale amendments cannot be approved again.
- `baseline_text` is immutable; `effective_text` is derived separately.

## Frontend truth

- No Snap request.
- Chain 61999 is checked before every write.
- Read and write clients use the same-origin RPC proxy.
- No green success before finalization, explicit execution success, and postcondition verification.
- Unknown execution evidence produces a delayed state and forbids blind resubmission.
- Python `strip()` behavior is mirrored by `pyStrip`; JavaScript `trim()` is not used for source postconditions.
- The 150 UTF-8-byte guard remains conservative until a measured boundary replaces it.
