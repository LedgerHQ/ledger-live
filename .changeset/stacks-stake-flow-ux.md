---
"@ledgerhq/coin-stacks": patch
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
---

fix(coin-stacks): show stake details on the device step, map device rejection to UserRefusedOnDevice, type pox stake/unstake as DELEGATE/UNDELEGATE, reject boot contracts as pools, estimate a stake before its data is complete, validate the stake form inline, retype stored contract-call operations on load (as CONTRACT_CALL: a stored row has no contract id, so stakes synced before this change stay "Contract call" while new ones are DELEGATE/UNDELEGATE), and fall back to the transfer fee rate when the node proxy has no POST /v2/fees/transaction route
