---
"@ledgerhq/coin-internet_computer": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
---

Add the ICP neuron management and voting-power confirmation flows on Desktop, with the periodic-confirmation decode and neuron helpers they run on.

An accepted command is reflected as soon as the network accepts it, without waiting for a device-signed refresh, and the account re-syncs after a stake. A command the device has already signed is offered for retry only when the network says nothing ran. Actions a neuron cannot take are not offered — Increase stake without a recoverable stake nonce, Increase dissolve delay with under a day of room, a followee list that changes nothing. Staked maturity counts toward the account's Total Maturity, and a rejected input names the bound it broke rather than an error class name.
