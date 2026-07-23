## live-wallet

> This library is the top layer of **Ledger Sync** (Cloud Sync SDK, WalletSyncDataManager,
> watch loop). See the full technical documentation: [`docs/ledger-sync`](../../docs/ledger-sync/README.md).

The goal of this library is to manage the accounts user data states.

Examples of accounts user data states are:

- Account's name
- Account's starred state

The library provides reducers and actions in the style of Redux, without depending on Redux itself.
