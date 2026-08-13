---
"ledger-live-desktop": minor
---

Surface ICP neuron staking on the account page: a stake banner for accounts that can afford a neuron
but hold none, a balance summary footer showing total staked and total maturity, and Stake / Manage
Neurons actions in the account header. The send flow now explains that the memo is protocol-derived
for `create_neuron` and `increase_stake` instead of offering an editable field. The two neuron flow
modals are registered but their bodies land separately.
