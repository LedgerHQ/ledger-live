---
"ledger-live-desktop": patch
"live-mobile": patch
"@features/platform-contacts": patch
---

Replace the stubbed Contacts "edit external address" device intent job with a real call into `@ledgerhq/device-contacts-kit`'s `ContactsManager.editExternalAddressIdentifier()`, which returns the rotated address-level proof to persist. The group-level name proof passes through an identifier edit untouched.

The device serves identifier and scope edits as two separate commands, and the kit only ships the identifier one so far (`EDIT SCOPE` is DSDK-1380). Until it lands, an edit that changes the entry's label is refused before any device interaction rather than half-applied: the label is bound into the address-level `hmacRest`, so changing the identifier and leaving the label behind would desync the stored proof from the device.
