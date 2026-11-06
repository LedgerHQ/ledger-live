---
"@features/platform-wallet-api-accounts": minor
"@shared/feature-flags": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Exploratory: behind the `walletApiAccountData` flag, the Wallet API serves `account.list` and `account.request` from the account data entities (accounts, names, balance, receive) instead of the legacy `Account`, keeping the account ids live apps stored
