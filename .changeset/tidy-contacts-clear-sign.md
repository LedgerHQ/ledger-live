---
"@features/platform-contacts": minor
"@ledgerhq/live-signer-evm": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Provide the EVM address book to the DMK Ethereum signer, so registered contacts can be clear-signed.

`toEvmAddressBook` maps the Contacts state to an `EvmAddressBook` snapshot, keeping EVM-family addresses only. Each app registers it on `evmAddressBookProvider` at its composition root, and `DmkSignerEth` reads it once per instance, so the recipient and the signing account are matched against the same snapshot. Records whose proof material does not decode are dropped, and signing is left untouched when no contact is usable.

Ledger account contacts are not provided yet: the snapshot always carries an empty `ledgerAccounts`.
