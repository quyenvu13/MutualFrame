# Mutation matrix

The source-regression suite starts from the known-good contract and removes one control at a time. The base source passes every category; each listed mutant fails at least one category.

| Mutation | Good source | Mutant | Gate |
|---|---:|---:|---|
| Reinsert labeled example marker | PASS | FAIL | No prompt examples |
| Remove reserved-marker prefilter | PASS | FAIL | Injection control |
| Replace whitespace collapse with simple strip | PASS | FAIL | Cache normalization |
| Raise fresh model-call cap | PASS | FAIL | Reroll bound |
| Remove baseline ID from cache key | PASS | FAIL | Cache scope |
| Remove immutable counterparty state | PASS | FAIL | Bilateral authority |
| Remove amendment approval method | PASS | FAIL | Load-bearing consequence |
| Remove effective-version pin | PASS | FAIL | Stale/replay defense |
| Reassign class-declared TreeMap in `__init__` | PASS | FAIL | StudioNet storage descriptor safety |

Run with `npm test`. The test exits nonzero if either the good source fails or any mutant remains accepted.
