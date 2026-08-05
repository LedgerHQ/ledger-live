---
"@ledgerhq/coin-internet_computer": minor
"@ledgerhq/types-live": minor
"@ledgerhq/ledger-wallet-framework": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)
