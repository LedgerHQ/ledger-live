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

- Introduction, Goals and Tradeoffs
  - [Quick gist of doing a transaction with ledger-live-common library](./docs/gist-tx.md)
- Getting started
  - [@ledgerhq/live-common setup](./docs/live-common-setup.md)
  - [tool \(aka ledger-live cli\)](./docs/tool.md)
  - demo project
  - mobile-test-app project
  - [Developing on Ledger Live Common](./docs/developing.md)
- The Currency models
- The Account models
  - Account
  - TokenAccount
  - ChildAccount
- Account and Portfolio logic
- The Bridges
  - CurrencyBridge
  - AccountBridge
- Countervalues
- Apps store logic
- Firmware Update logic
