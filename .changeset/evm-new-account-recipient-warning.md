---
"@ledgerhq/coin-evm": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Explain the higher network fees when sending to an address that does not exist yet. EIP-8037 charges account creation substantially more gas, and nothing in the send flow told the user why the fee jumped. The gas we send is unchanged: `eth_estimateGas` remains the only source.
