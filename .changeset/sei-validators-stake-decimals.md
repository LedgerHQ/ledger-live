---
"@ledgerhq/coin-evm": patch
"live-mobile": patch
---

Fix SEI_EVM validator total stake decimals: scale usei (6 decimals) to the native 18-decimal unit so displayed amounts are correct. Also fix the mobile EVM validator row to show the total staked amount instead of a hardcoded "0.00 % APR".
