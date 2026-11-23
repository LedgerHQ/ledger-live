---
"@domain/entity-account-descriptor": minor
"@domain/entity-account": minor
"@domain/entity-account-name": minor
"@domain/api-account-data": minor
"@features/platform-account-data": minor
"@features/platform-account-discovery": minor
"@features/platform-observability-redaction": minor
"@features/flow-receive": minor
"@devtools/bindings": minor
"@devtools/mock-accounts": minor
"@ledgerhq/live-common": minor
"@ledgerhq/wallet-cli": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Keep the account descriptor at the edges: code holds the AccountUUID, analytics and Datadog scrub account descriptors; wallet-cli rejects an empty account key
