---
"@ledgerhq/live-signer-solana": minor
"@features/platform-contacts": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Inject the Solana address book into the DMK Solana signer so Solana transactions can clear-sign saved contact names.

Adds a `solanaAddressBookProvider` instance (on the shared `AddressBookProvider<T>`), a pure `toSolanaAddressBook` mapper (`Contact[] -> SolanaAddressBook`, Solana-family only, no chain id, `ledgerAccounts` always empty), and registers the source at each app's composition root. An absent or empty book leaves signing behavior unchanged.
