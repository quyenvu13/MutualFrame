# Blind runtime protocol

Use this protocol to prevent prompt/test leakage and confirmation bias.

1. Freeze contract bytes and record `SOURCE_SHA256.txt` before choosing final test sentences.
2. A tester who did not author the validator prompt writes the runtime vectors.
3. Search the contract source for every distinctive phrase from the vectors. Any match invalidates the set.
4. Do not include category labels, expected outputs, or test-domain nouns in the prompt as examples.
5. Run vectors in a fresh baseline and record all three closed outcomes, authorization failures, cache behavior, and amendment consequence.
6. Include at least one same-call fail-then-success pair: `propose_amendment` before and after mutual governance.
7. Include at least one outsider failure and one stale/replay failure.
8. Record transaction hash, consensus state, explicit leader execution result, and a postcondition read for every write.
9. If bytes or prompt change, discard the evidence and start again with new vectors.
10. Keep the final vectors in `TESTING.md`, never in the contract prompt.

Current v1.4 vectors are defined in `TESTING.md`; runtime execution is `PENDING`.
