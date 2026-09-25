---
"@ledgerhq/live-dmk-shared": minor
"@ledgerhq/live-signer-tron": minor
"@features/platform-contacts": minor
"@ledgerhq/live-signer-evm": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Inject the Tron address book into the DMK Tron signer so Tron transactions can clear-sign saved contact names.

Adds a generic `AddressBookProvider<T>` in `live-dmk-shared` (the EVM provider is refactored onto it), a `tronAddressBookProvider` instance, a pure `toTronAddressBook` mapper (`Contact[] -> TronAddressBook`, Tron-family only, no chain id, `ledgerAccounts` always empty), and registers the source at each app's composition root. An absent or empty book leaves signing behavior unchanged.
