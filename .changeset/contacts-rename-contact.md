---
"ledger-live-desktop": patch
"live-mobile": patch
"@features/platform-contacts": patch
---

Replace the stubbed Contacts "rename contact" device intent job with a real call into `@ledgerhq/device-contacts-kit`'s `ContactsManager.renameContact()`, which returns the rotated contact-level name proof to persist.

Rename is a blockchain-agnostic dashboard operation, so the intent initializes on the dashboard (`BOLOS`) instead of a coin app: the kit's device action navigates there itself and enforces the Contacts minimum OS version. Two consequences follow — a contact with no address is now renameable, and an outdated device surfaces as an OS-update screen rather than an app-update one.
