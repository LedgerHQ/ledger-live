---
"@domain/entity-account-descriptor": minor
"@domain/entity-account": minor
"@domain/entity-network": minor
"@domain/entity-derivation": minor
"@domain/entity-account-balance": minor
"@domain/entity-account-balance-history": minor
"@domain/entity-account-data": minor
"@domain/entity-account-operation": minor
"@domain/entity-account-receive": minor
"@domain/entity-account-status": minor
"@domain/api-account-data": minor
"@domain/api-market-countervalues": minor
"@features/flow-receive": minor
"@features/platform-account-data": minor
"@features/platform-account-source-coin-module": minor
"@features/platform-account-source-portfolio": minor
"@devtools/bindings": minor
"@devtools/mock-accounts": minor
"@ledgerhq/live-common": minor
"@ledgerhq/wallet-cli": minor
---

Keep `@domain/entity-account-descriptor` for the edges: AccountUUID moves to `@domain/entity-account`, NetworkId and Address to the new `@domain/entity-network`, DerivationPath and the legacy path bridges to `@domain/entity-derivation`
