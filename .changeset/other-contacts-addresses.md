---
"@features/platform-contacts": minor
"@features/flow-contacts": patch
"live-mobile": patch
"ledger-live-desktop": patch
---

Add `useOtherContactsAddresses(excludeContactId?)` so the duplicate-address list is built in one place, with each owner's display name: "This address is already used for My addresses (Me)." It replaces five copies in the Contacts and Send view models.
