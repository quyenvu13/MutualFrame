# Changelog

## 1.4.1 Project release

- Pinned the verified StudioNet Project address `0x00B1cFb4cdd08A09097A5344668E1914031eb96F`.
- Verified deploy finalization, GenVM success, accepted consensus, zero-state `get_config()`, and exact deployed-source SHA-256 parity.
- Updated Explorer links to `explorer-studio.genlayer.com`.

## 1.4.1 — 2026-09-18

- Removed `TreeMap()` reassignment from `__init__` after StudioNet deployment proved that class-declared maps are already storage descriptors.
- Added a mutation gate that fails if a class-declared TreeMap is reassigned again.
- Invalidated the failed predeploy package and regenerated the frozen source hash.

## 1.4.0 — 2026-09-18

- Removed labeled examples and runtime-vector leakage from the semantic prompt.
- Added deterministic prompt-control rejection and safe JSON data fencing.
- Added immutable counterparty binding and load-bearing amendment proposal/approval.
- Added governance/effective-version pinning and stale amendment handling.
- Added whitespace/case-normalized per-baseline cache and fresh-model-call cap of 8.
- Kept StudioNet storage maps class-declared.
- Replaced SDK CDN imports with a pinned esbuild bundle.
- Removed Snap-dependent connection flow and added chain checks before every write.
- Added same-origin RPC proxy, Python-compatible stripping, UTF-8 byte guard, and calldata probe.
- Added direct contract tests, mutation teeth, CI, locked spec, security guide, and runtime evidence template.
- Invalidated every prior deployment reference and runtime claim after the source-byte change.
