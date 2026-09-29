---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Import the countervalues logic, types, helpers and mocks from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and depend on the entity package in place of the legacy one. Specifier change only, no behaviour change.

Three app tests move with live-common because the `calculate` they mock is called inside live-common: desktop's `useHistoryOperations` and mobile's `useOperationsListViewModel` and `useOperationsV1`. Their mock has to name the same module live-common imports.
