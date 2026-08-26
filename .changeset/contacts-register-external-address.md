---
"ledger-live-desktop": patch
"live-mobile": patch
"@features/platform-contacts": patch
---

Replace the stubbed Contacts "register external address" device intent job with a real call into `@ledgerhq/device-contacts-kit`'s `ContactsManager.registerExternalAddress()`.
