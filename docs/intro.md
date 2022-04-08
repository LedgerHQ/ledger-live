## Introduction, Goals and Tradeoffs

Before considering using a library or contributing to it, it's important to understand its goals and tradeoffs (or non-goals).

### The entry to Ledger Live

Ledger Live Common is [Ledger Live](https://github.com/LedgerHQ/ledger-live-desktop)'s business logic library.

Contributing to Ledger Live is actually likely going to happen in this library.

We can highlight this library have:

- [**Currency models**](./currency.md) logic: Fiat and Crypto currencies data, icons and logic (formatters, parsers,...).
- [**Account models**](./account.md) logic: all helpers to display accounts and portfolio to the user.
- **Hardware Wallet logic** for all interaction with our devices.
- **Manager logic** including [apps store logic](./apps.md) and firmware updates.
- [CurrencyBridge](./CurrencyBridge.md) and [AccountBridge](./AccountBridge.md) logic: All the logic needed for **Add Accounts** (scan accounts from Ledger devices), **Receive flow** (get account addresses), **Send flow** (blockchain transactions), and beyond... (specific currency feature are possible. Tezos staking is one example)
- Countervalues logic: converting crypto currencies amount to fiat amounts.

### What remains on user land

This library does not have/is agnostic of:

- The actual HW transport you use. But you can easily find one on [ledgerjs libraries](https://github.com/LedgerHQ/ledgerjs) (or implement your own). _There are many communication channel possible: webusb, u2f, webhid, webble, node-hid, react-native-hid, react-native bluetooth,...)_

### One library, multiple usecases

Ledger Live is one monolithic library that glue everything together, yet things are decoupled in a way that you can still use it for specific usecase without importing everything in the final bundle.

This works by having multiple entry points.

For instance, the Manager apps logic is imported from `@ledgerhq/live-common/lib/apps` and the currencies logic is in `@ledgerhq/live-common/lib/currencies`.

### Modular coins support architecture

Ledger Live Common is designed to have very generic models (for currencies, accounts) but to also facilitate new coin integrations and via different ways (pure JS implementation,...).

[More information in Coin Integration Introduction...](./ci-intro.md)

### The tech stack

We use FlowType for type safety. There are plan to eventually migrate to TypeScript but no ETA yet.

On top of Flowtype, we also use a extended set of JS incoming features like React, import syntax, class properties,... Therefore Babel is used to transpile our code from `src/` folder to `lib/` folder. (see
`.babelrc`)

> This is purely an internal technology, the target module is a regular JavaScript package and `@ledgerhq/live-common` can totally be used in JS context.

### Code convention

We use ESlint linter and Prettier code formatter.
