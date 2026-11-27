---
"@ledgerhq/live-common": minor
"@ledgerhq/transaction-observability": minor
"@ledgerhq/wallet-cli": minor
"@shared/feature-flags": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Serve native SOL deposits to the Earn live app: the `custom.stake.deposit.estimate` method answers the largest stake amount the host accepts, the `earnSolanaHighlightedValidators` flag lists the highlighted validators, the Solana stake amount is computed in one place shared with the Wallet CLI, and every Earn manifest, `earn-stg-eks` included, is left to the Earn live app by the transaction observer
