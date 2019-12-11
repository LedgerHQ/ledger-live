## “Ledger Live Common” `@ledgerhq/live-common`

`````
                ````
           `.--:::::
        `.-:::::::::       ````
       .://///:-..``     `-/+++/-`
     `://///-`           -++++++o/.
    `/+++/:`            -+++++osss+`
   `:++++:`            ./++++-/osss/`
   .+++++`             `-://- .ooooo.
   -+ooo/`                ``  `/oooo-
   .oooo+` .::-.`             `+++++.
   `+oooo:./+++/.             -++++/`
    -ossso+++++:`            -/+++/.
     -ooo+++++:`           .://///.
      ./+++++/`       ``.-://///:`
        `---.`      -:::::///:-.
                    :::::::-.`
                    ....``

`````

Ledger Live Common (`@ledgerhq/live-common`) is a JavaScript library available via a [NPM package](https://npmjs.com/@ledgerhq/live-common).

This library depends on a bunch of [ledgerjs packages](https://github.com/LedgerHQ/ledgerjs) and put together the core business logic behind [Ledger Live Desktop](https://github.com/LedgerHQ/ledger-live-desktop) and [Ledger Live Mobile](https://github.com/LedgerHQ/ledger-live-mobile).

The stack is pretty standard for a ES6 and FlowType library. The notable dependencies are libraries like **RxJS** and **BigNumber.js**. There is also a bit of React and Redux but exposed in agnostic ways (meaning it's not mandatory to use – there will be dedicated entry point for them to offer utilities like React Hooks).

### Table of content

- [Introduction, Goals and Tradeoffs](./docs/intro.md)
- Getting started
  - [Setup to use `@ledgerhq/live-common`](./docs/live-common-setup.md)
  - [Developing with Ledger Live Common](./docs/developing.md)
  - [`ledger-live` CLI (tool)](./docs/tool.md)
  - **demo** web playground
  - `mobile-test-app` test project
- Learn by example
  - [gist: transaction with a Ledger device](./docs/gist-tx.md)
  - gist: Update firmware of a Ledger device
- [The Currency models](./docs/currency.md)
- [The Account models and portfolio logic](./docs/account.md)
- The [CurrencyBridge](./docs/CurrencyBridge.md): scan accounts with a device
- The [AccountBridge](./docs/CurrencyBridge.md): synchronize an account and perform transaction
- [Apps store logic](./docs/apps.md)
- [Firmware Update logic](./docs/firmware-update.md)
- [Countervalues logic](./docs/countervalues.md)
- Coin integrations
  - [Introduction](./docs/ci-intro.md)
  - The address derivation (BIP44 and exceptions)
  - Multi bridges implementations (JS, Libcore, Mock)
- The different test approaches
  - Unit test of live-common logic
  - End-to-end tests of the `ledger-live` command
  - Bridge dataset tests
  - Providing mocks to implement UI tests
