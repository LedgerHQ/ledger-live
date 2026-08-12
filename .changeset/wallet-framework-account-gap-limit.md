---
"@ledgerhq/ledger-wallet-framework": minor
---

Honor the gap limit setting during account discovery: count consecutive empty accounts (reset on a used account) so discovery can cross empty gaps to reach later used accounts, and only ever offer the first empty account as creatable
