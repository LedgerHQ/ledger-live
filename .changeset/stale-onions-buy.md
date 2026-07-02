---
"ledger-live-desktop": minor
"@ledgerhq/live-common": minor
---

Fix Celo network-fee display for sub-18-decimal fee currencies (USDC/USDT): the CIP-64 fee-currency adapter reports gas price in 18 decimals, so the fee is now rescaled to the selected fee token's decimals before display in the new send flow.
