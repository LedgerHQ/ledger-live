---
"@ledgerhq/live-e2e-shared": patch
"ledger-live-mobile-e2e-tests": patch
---

Fix the nightly mobile borrow e2e run.

`BorrowPage.expectStepDone` reached for detox's `device` global, which a page object is not
loaded with, so the first signed step threw `ReferenceError: device is not defined` after its
transaction had already gone out — and every retry then found the approval step complete and
failed on its "not yet done" precondition. Granting Morpho access is account state rather than
per-loan state, so that step now passes through when it is already granted.

The Speculos driver gained the Ethereum app's blind-signing setting, without which Morpho
calldata is answered with `6a80` and no review is ever drawn, plus the risk warning that
enabling it puts in front of the review. Transaction Check now stops waiting as soon as that
warning appears instead of spending its whole budget on it.

The borrow driver also floors the keyless RPC's priority-fee suggestion so its broadcasts get
mined, keeps the fee cap proportional to the base fee so the node's up-front reservation stays
within the account balance, retries reads the RPC's archive-restricted backends reject, polls
for the receipt rather than watching whole blocks for a replacement, waits for a remote
Speculos to be ready so its address is published, and reports the partner's reason for a
rejected action instead of only the status line.
