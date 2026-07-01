**[We are hiring, join us! 👨‍💻👩‍💻](https://jobs.lever.co/ledger/?department=Tech)**

<img src="https://user-images.githubusercontent.com/3273751/151214602-f5153588-1911-4456-ae65-604d56821b36.png" height="80" /> <img src="https://user-images.githubusercontent.com/211411/52533081-e679d380-2d2e-11e9-9c5e-571e4ad0107b.png" height="80" />

[![Ledger Devs Slack](https://img.shields.io/badge/Slack-LedgerDevs-yellow.svg?style=flat)](https://ledger-dev.slack.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Welcome to Ledger's JavaScript libraries.

**See also:**

- [Changelog](https://github.com/LedgerHQ/ledger-live/releases)
- [**LedgerJS examples**](https://github.com/LedgerHQ/ledgerjs-examples)
- [Ledger Live Desktop](https://github.com/LedgerHQ/ledger-live/tree/develop/apps/ledger-live-desktop)
- [Ledger Live Mobile](https://github.com/LedgerHQ/ledger-live/tree/develop/apps/ledger-live-mobile)
- [live-common](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledger-live-common)
- Deprecated libraries are archived in https://github.com/LedgerHQ/ledgerjs-legacy

## `@ledgerhq/hw-transport-*`

> [!IMPORTANT]
> The recommended way to communicate with a Ledger device is now the [Ledger Device Management Kit (DMK)](https://developers.ledger.com/docs/device-interaction/integration/how_to/dmk). New integrations should use the DMK.

The _hw-transport_ libraries implement the communication protocol with our [hardware wallet devices](https://www.ledger.com/) over a given channel. Production device communication now goes through the [DMK](https://developers.ledger.com/docs/device-interaction/integration/how_to/dmk); the transports that remain in this repository are for development and testing:

- [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-http.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-http) [@ledgerhq/hw-transport-http](./packages/hw-transport-http) **[DEV only]** universal HTTP channel. **NOT for PROD**.
- [@ledgerhq/hw-transport-node-speculos](./packages/hw-transport-node-speculos) and [@ledgerhq/hw-transport-node-speculos-http](./packages/hw-transport-node-speculos-http) – communication with the Speculos device simulator.
- [@ledgerhq/hw-transport-mocker](./packages/hw-transport-mocker) – record and replay APDU calls in tests.

The legacy U2F / WebAuthn transports are archived in [ledgerjs-legacy](https://github.com/LedgerHQ/ledgerjs-legacy).

### A unified _Transport_ interface

All these transports implement a generic interface exposed by
[@ledgerhq/hw-transport](./packages/hw-transport).
There are specifics for each transport which are explained in each package.

A Transport is essentially:

- `Transport.listen: (observer)=>Subscription`
- `Transport.open: (descriptor)=>Promise<Transport>`
- `transport.exchange(apdu: Buffer): Promise<Buffer>`
- `transport.close()`

and some derivates:

- `transport.create(): Promise<Transport>`: make use of `listen` and `open` for the most simple scenario.
- `transport.send(cla, ins, p1, p2, data): Promise<Buffer>`: a small abstraction of `exchange`

> NB: [APDU](https://en.wikipedia.org/wiki/Smart_card_application_protocol_data_unit) is the encoding primitive for all binary exchange with the devices. (it comes from smart card industry)

## `@ledgerhq/hw-app-*`

As soon as your _Transport_ is created, you can already communicate by implementing the apps protocol (refer to application documentations, for instance [BTC app](https://github.com/LedgerHQ/ledger-app-btc/blob/master/doc/btc.asc) and [ETH app](https://github.com/LedgerHQ/ledger-app-eth/blob/master/doc/ethapp.asc) ones).

We also provide libraries that help implementing the low level exchanges. These higher level APIs are split per app:

- [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-eth.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-eth) [@ledgerhq/hw-app-eth](./packages/hw-app-eth): Ethereum Application API
- [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-btc.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-btc) [@ledgerhq/hw-app-btc](./packages/hw-app-btc): Bitcoin Application API
- [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-xrp.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-xrp) [@ledgerhq/hw-app-xrp](./packages/hw-app-xrp): Ripple Application API
- [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-str.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-str) [@ledgerhq/hw-app-str](./packages/hw-app-str): Stellar Application API

**Community packages:**

- [![npm](https://img.shields.io/npm/v/@cardano-foundation/ledgerjs-hw-app-cardano.svg)](https://www.npmjs.com/package/@cardano-foundation/ledgerjs-hw-app-cardano) [@cardano-foundation/ledgerjs-hw-app-cardano](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano): Cardano ADA Application API

- [![npm](https://img.shields.io/npm/v/ledger-cosmos-js.svg)](https://www.npmjs.com/package/ledger-cosmos-js) [ledger-cosmos-js](https://github.com/cosmos/ledger-cosmos-js): Cosmos/Tendermint Application API

## Other packages

### Published Packages

| Package                                                                                                           | Version                                                                                                                               | Description                                              |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`create-dapp`](https://github.com/LedgerHQ/ledgerjs-legacy/tree/master/packages/create-dapp)                     | [![npm](https://img.shields.io/npm/v/create-dapp.svg)](https://www.npmjs.com/package/create-dapp)                                     | Ledger DApp Ethereum starter kit                         |
| [`@ledgerhq/web3-subprovider`](https://github.com/LedgerHQ/ledgerjs-legacy/tree/master/packages/web3-subprovider) | [![npm](https://img.shields.io/npm/v/@ledgerhq/web3-subprovider.svg)](https://www.npmjs.com/package/@ledgerhq/web3-subprovider)       | web3 subprovider implementation for web3-provider-engine |
| **Development Tools**                                                                                             |
| [`@ledgerhq/hw-transport-mocker`](/packages/hw-transport-mocker)                                                  | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-mocker.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-mocker) | Tool used for test to record and replay APDU calls.      |

## Basic gist

```js
import AppBtc from "@ledgerhq/hw-app-btc";

// `transport` is a @ledgerhq/hw-transport instance. For new integrations, obtain it
// from the Ledger Device Management Kit (DMK):
// https://developers.ledger.com/docs/device-interaction/integration/how_to/dmk
const getBtcAddress = async transport => {
  const btc = new AppBtc(transport);
  const result = await btc.getWalletPublicKey("44'/0'/0'/0/0");
  return result.bitcoinAddress;
};
```

## Contributing

Please read our [contribution guidelines](./CONTRIBUTING.md) before getting
started, and install the pinned repo toolchain with `mise install`.

### Install dependencies

Run commands from the repository root.

```bash
pnpm i
```

### Build

Build all packages

```bash
pnpm build:ljs
```

### Watch

Watch all packages change. Very useful during development to build only file that changes.

```bash
pnpm watch:ljs
```

### Lint

Lint all packages

```bash
pnpm lint --filter="./libs/ledgerjs/**"
```

### Typecheck

Typecheck all packages

```bash
pnpm typecheck --filter="./libs/ledgerjs/**"
```

### Run Tests

First of all, this ensure the libraries are correctly building, and passing tests:

```bash
pnpm test --filter="./libs/ledgerjs/**"
```

> make sure to configure your device app with "Browser support" set to "YES".

### Deploy

Checklist before deploying a new release:

- you have the right in the LedgerHQ org on NPM
- you have run `pnpm login` once (check `pnpm whoami`)
- Go to **master** branch
  - your master point on LedgerHQ repository (check with `git config remote.$(git config branch.master.remote).url` and fix it with `git branch --set-upstream master origin/master`)
  - you are in sync (`git pull`) and there is no changes in `git status`
- Run `pnpm i` once, there is still no changes in `git status`

**deploy a new release**

```
pnpm clean:ljs && pnpm build:ljs && pnpm doc:ljs && pnpm publish --filter="./libs/ledgerjs/**"
```

then, go to [/releases](https://github.com/LedgerHQ/ledger-live/releases) and create a release with change logs.

---

## Are you adding the support of a blockchain to Ledger Live?

This part of the repository is where you will add your blockchain to the cryptoasset library.

For a smooth and quick integration:

- See the developers’ documentation on the [Developer Portal](https://developers.ledger.com/docs/coin/general-process/) and
- Go on [Discord](https://developers.ledger.com/discord-pro/) to chat with developer support and the developer community.

## Are you adding Ledger device support to your web/mobile/desktop application?

This part of the repository contains the transport libraries that will be used to establish the communication between your app and Ledger devices.

For a smooth and quick integration:

- See the developers’ documentation on the [Developer Portal](https://developers.ledger.com/docs/transport/overview/) and
- Go on [Discord](https://developers.ledger.com/discord-pro/) to chat with developer support and the developer community.

---
