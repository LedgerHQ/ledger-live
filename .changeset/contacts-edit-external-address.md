---
"ledger-live-desktop": patch
"live-mobile": patch
"@features/platform-contacts": patch
---

Replace the stubbed Contacts "edit external address" device intent job with real calls into `@ledgerhq/device-contacts-kit`'s `ContactsManager.editExternalAddressIdentifier()` and `ContactsManager.editExternalAddressScope()`, each returning the rotated address-level proof to persist. The group-level name proof passes through both edits untouched.

The device serves identifier and label edits as two separate commands, so an edit touching both runs as a chain: the identifier step first, then the label step. The device stores no address book — it verifies the `hmacRest` proof it is given, asks the user, and returns a fresh one — so each proof covers one specific identifier/label pair. That is what dictates the chain's shape: the identifier step proves the entry as recorded and yields the proof the label step must present.

That statelessness also makes the chain atomic from the host's point of view. An abandoned or rejected edit drops the intermediate proof and leaves the stored record untouched and still valid, so nothing partial is ever reported to the consumer and a retry restarts the whole chain rather than resuming mid-way.
