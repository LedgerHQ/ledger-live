---
"@shared/api-services": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/wallet-cli": minor
"@ledgerhq/live-cli": minor
"@features/platform-currencies": minor
---

Stop retrying a CAL request answered with 403 or 407, as a proxy that denies the host answers the same way every time, and keep the HTTP status on LedgerAPI4xx and LedgerAPI5xx
