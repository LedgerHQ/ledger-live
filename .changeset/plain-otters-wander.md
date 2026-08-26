---
"@ledgerhq/coin-internet_computer": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
---

Reflect an accepted ICP neuron command without waiting for a device-signed refresh, including the dissolve-delay changes that re-lock or extend a neuron, and let the account sync after a stake so the balance updates. Recognize a staking transfer from its own memo, so it is no longer relabelled a plain send until the first neuron refresh. Name the governance rejection and ingress reject errors so they carry the network's own wording, and stop offering a blind retry when the outcome is unknown. Retry now returns to the step that collected the input rather than straight to the device. Hide Increase stake when the neuron's stake nonce is not recoverable from this account's history, require a followee list that changes something before it can be signed, explain rather than blank the Manage step when the neuron has left the snapshot, stop the neuron input steps from opening with an error on an untouched field, stop the confirmation step reporting an earlier success after a later refusal, surface the staking notices the bridge raises, and show the account's own principal when adding a hot key.
