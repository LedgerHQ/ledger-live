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
  - [Quick gist of doing a transaction with ledger-live-common library](./docs/gist-tx.md)
- Getting started
  - [@ledgerhq/live-common setup](./docs/live-common-setup.md)
  - [tool \(aka ledger-live cli\)](./docs/tool.md)
  - demo project
  - mobile-test-app project
  - [Developing on Ledger Live Common](./docs/developing.md)
- [The Currency models](./docs/currency.md)
- [The Account models](./docs/account.md)
  - Account and Portfolio logic
- The Bridges
  - [CurrencyBridge](./docs/CurrencyBridge.md)
  - [AccountBridge](./docs/CurrencyBridge.md)
- [Countervalues](./docs/countervalues.md)
- [Apps store logic](./docs/apps.md)
- [Firmware Update logic](./docs/firmware-update.md)
- The different test approaches
  - Unit test of live-common logic
  - End-to-end tests of the `ledger-live` command
  - Bridge dataset tests
  - Providing mocks to implement UI tests
