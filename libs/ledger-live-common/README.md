**[We are hiring, join us! 👨‍💻👩‍💻](https://jobs.lever.co/ledger/?department=Tech)**

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

This library depends on a bunch of [ledgerjs packages](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) and put together the core business logic behind [Ledger Live Desktop](https://github.com/LedgerHQ/ledger-live/tree/develop/apps/ledger-live-desktop) and [Ledger Live Mobile](https://github.com/LedgerHQ/ledger-live/tree/develop/apps/ledger-live-mobile).

The stack is pretty standard for a ES6 and FlowType library. The notable dependencies are libraries like **RxJS** and **BigNumber.js**. There is also a bit of React and Redux but exposed in agnostic ways (meaning it's not mandatory to use – there will be dedicated entry point for them to offer utilities like React Hooks).

## Table of Contents

- [Introduction, Goals and Tradeoffs](https://github.com/LedgerHQ/ledger-live/wiki/LLC:intro)
- Getting started
  - [`ledger-live` CLI](https://github.com/LedgerHQ/ledger-live/wiki/LLC:cli)
  - **tools** web playground
  - `mobile-test-app` test project
- Learn by example
  - [gist: transaction with a Ledger device](https://github.com/LedgerHQ/ledger-live/wiki/LLC:gist-tx)
  - [gist: Update firmware of a Ledger device](https://github.com/LedgerHQ/ledger-live/wiki/LLC:gist-firmware)
  - ...
- [The Currency models](https://github.com/LedgerHQ/ledger-live/wiki/LLC:currency) and utilities
- [The Account models and portfolio logic](https://github.com/LedgerHQ/ledger-live/wiki/LLC:account)
- The [CurrencyBridge](https://github.com/LedgerHQ/ledger-live/wiki/LLC:CurrencyBridge): scan accounts with a device
- The [AccountBridge](https://github.com/LedgerHQ/ledger-live/wiki/LLC:AccountBridge): synchronize an account and perform transaction
- [Hardware Wallet logic](https://github.com/LedgerHQ/ledger-live/wiki/LLC:hw)
- [Apps store logic](https://github.com/LedgerHQ/ledger-live/wiki/LLC:apps)
- Firmware Update logic
- [Countervalues logic](https://github.com/LedgerHQ/ledger-live/wiki/LLC:countervalues)
- Coin integration specifics
  - [Introduction](https://github.com/LedgerHQ/ledger-live/wiki/LLC:ci-intro)
  - Bridge implementations, where to start? (JS, Libcore, Mock)
  - Implementing the hardware wallet logic of a new coin
  - [The account derivation (BIP44 and exceptions)](https://github.com/LedgerHQ/ledger-live/wiki/LLC:derivation)
- Advanced
  - [api/socket `createDeviceSocket` and script runner](https://github.com/LedgerHQ/ledger-live/wiki/LLC:socket)
  - env.js: live-common configuration system
  - Serialization and reconciliation
  - cross.js and "LiveQR" protocol
  - cache.js helpers
  - Tokens management and ERC20
  - [Developing with lib-ledger-core bindings](https://github.com/LedgerHQ/ledger-live/wiki/LLC:adding-libcore-bindings)

### Developing with Ledger Live Common

- [Developing setup](https://github.com/LedgerHQ/ledger-live/wiki/LLC:developing)
- The different test approaches
  - Unit test of live-common logic
  - End-to-end tests of the `ledger-live` command
  - Bridge dataset tests
  - Providing mocks to implement UI tests

---

## Are you adding the support of a blockchain to Ledger Live?

This part of the repository is where you will add most of your code.

For a smooth and quick integration:
- See the developers’ documentation on the [Developer Portal](https://developers.ledger.com/docs/coin/general-process/) and 
- Go on [Discord](https://developers.ledger.com/discord-pro/) to chat with developer support and the developer community.

---
