---
"@ledgerhq/coin-internet_computer": major
---

The node URL comes from the coin config (`node.url`, mainnet by default) for both the API and the account bridge. Breaking: the network client functions re-exported from `./api` and `refreshNeuronStake` take the host as their first argument.
