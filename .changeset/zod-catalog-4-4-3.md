---
"@ledgerhq/ledger-wallet-framework": patch
---

chore: align the zod catalog on 4.4.3

`@ledgerhq/auth` and `@ledgerhq/wallet-api-core` both depend on zod 4.4.3, so the
workspace catalog pin at 4.3.6 resolved a second copy of zod into the desktop and
mobile bundles. Moving the catalog to 4.4.3 collapses the two into one.
