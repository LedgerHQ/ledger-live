<h3 align="center">
  <image src="https://user-images.githubusercontent.com/3428394/165078916-06fe0b1b-c11d-4c6f-9c1a-ac9291333852.png" alt="ledger-logo" height="100" />
  &nbsp;
  <image src="https://user-images.githubusercontent.com/3428394/165078595-1b2a55ae-783a-4c8f-8548-c4f050ae5e76.png" alt="js-logo" height="100" />
  <br/>
  <h3 align="center">The Ledger Live JavaScript Ecosystem</h3>
  <h4 align="center">
    <a href="https://jobs.lever.co/ledger/?department=Tech">
      We are hiring, join us! 👨‍💻👩‍💻
    </a>
  </h4>
</h3>

[![gitpoap badge](https://public-api.gitpoap.io/v1/repo/LedgerHQ/ledger-live/badge)](https://www.gitpoap.io/gh/LedgerHQ/ledger-live)

## About

`ledger-live` is a **monorepository** whose purpose is to centralize all the JavaScript code related to the [**Ledger Live**](https://www.ledger.com/ledger-live) applications in one place.

[**Ledger Live**](https://www.ledger.com/ledger-live) is our platform of apps and services designed specifically for seamless integration with your Ledger device. Acting as a secure gateway to the crypto ecosystem, it allows direct access to a diverse range of crypto, NFT and DeFi services. This integration ensures a safer and more user-friendly experience that address a common security issue known as 'blind signing'.

Developers looking to integrate their blockchain in Ledger Live are invited to head to the [**Developer Portal**](https://developers.ledger.com) where they will find the section [**Blockchain Support**](https://developers.ledger.com/docs/coin/general-process).

## Installation

> 💡 **This is only a minimal setup. You will need to perform additional installation steps depending on the package you want to work on, please refer to its nested readme file.**

### Cloning

```bash
git clone git@github.com:LedgerHQ/ledger-live.git
cd ledger-live
```

### Proto

**⚠️ Important**: In order to install the right version of the tools you will need to install the [`proto`](https://moonrepo.dev/proto) toolchain manager.
Please follow the instructions on the [**proto**](https://moonrepo.dev/docs/proto/install) website to install it.

Once you have installed `proto`, please run the following command:

```bash
# Will download and install the supported versions of nodejs, npm and pnpm.
# Run it from the root or a subfolder of the repository.
proto use
```

### Dependencies

Use the [pnpm](https://pnpm.io/fr/) package manager to install the dependencies in the whole workspace:

```bash
pnpm i
# Alternatively, if you want to bypass the postinstall scripts which can be long to run
# pnpm i --ignore-scripts
```

> Note: multiple postinstall steps will be triggered and fail if the applications prerequisites are not met.
> You can safely ignore the errors if you do not plan to work on those apps.

## Usage

**Important: All the commands should be run at the root of the monorepo.**

### Tools

We use [**pnpm workspaces**](https://pnpm.io/) and [**turborepo**](https://turborepo.org/) under the hood to handle local and external dependencies, orchestrate tasks and perform various optimizations like package hoisting or [**remote caching**](https://turborepo.org/docs/features/remote-caching).

For changelog generation releases and package publishing we rely on the [**changesets**](https://github.com/changesets/changesets) library.

### Root scripts

The scripts that are defined inside the root [`/package.json`](https://github.com/LedgerHQ/ledger-live/blob/develop/package.json) file will use _turborepo_ under the hood and automatically perform needed tasks before running the action.

```sh
# This command will first build all the local dependencies needed in the right order.
# Only then it will attempt to build the `Ledger Live Desktop` app.
pnpm build:lld
```

### Aliases

To run nested scripts which are not covered at the root, you should **not** change your working directory.
Every package has an **alias** defined (see application or library tables or check out the [`package.json`](https://github.com/LedgerHQ/ledger-live/blob/develop/package.json) file) that you can use as a prefix when running the script from the root.

```sh
# `pnpm desktop` is one of the shorthands written to avoid changing the working directory.

# The following command will run the nested `test` script.
# `test` is defined inside the `./apps/ledger-live-desktop/package.json` file.
pnpm desktop test
```

**Note that when using these kinds of scripts you will have to make sure that the dependencies are built beforehand.**

### Scoping

You can scope any _pnpm_ or _turborepo_ based script by using the `--filter` flag.

**This is a very powerful feature that you should look into if you are a frequent contributor.**

Please check out the [_pnpm_](https://pnpm.io/filtering) or [_turborepo_](https://turborepo.org/docs/core-concepts/filtering) documentation for more details (the syntax is almost similar albeit _pnpm_ being a bit more powerful).

Here are some examples:

```sh
# Install all the dependencies needed for the packages under ./libs
pnpm i -F "{libs/**}..."
# Run lint only on packages that have been changed compared to origin/develop
pnpm lint --filter=[origin/develop]
# Test every package that has been changed since the last commit excluding the applications
pnpm run test --continue --filter="!./apps/*" --filter="...[HEAD~1]"
# Run typechecks for the Ledger Live Mobile project
pnpm typecheck --filter="live-mobile"
```

## Documentation

Each project folder has a `README.md` file which contains basic documentation.
It includes background information about the project and how to setup, run and build it.

Please check the [**wiki**](https://github.com/LedgerHQ/ledger-live/wiki) for additional documentation.

## Structure

The sub-packages are (roughly) split into three categories.

### `/app` - Applications

The applications are user-facing programs which depend on one or more libraries.

<details><summary><b>Ledger Live Applications</b></summary>
<br/>
<p>

| Name                                                                                                     | Alias          | Download                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**Ledger Live Desktop**](https://github.com/LedgerHQ/ledger-live/tree/develop/apps/ledger-live-desktop) | `pnpm desktop` | [Website](https://www.ledger.com/ledger-live/download)                                                                                                           |
| [**Ledger Live Mobile**](https://github.com/LedgerHQ/ledger-live/tree/develop/apps/ledger-live-mobile)   | `pnpm mobile`  | [Android](https://play.google.com/store/apps/details?id=com.ledger.live&hl=fr&gl=US) / [iOS](https://apps.apple.com/fr/app/ledger-live-web3-wallet/id1361671700) |

</p>
</details>

### `/libs` - Libraries

Libraries serve as publicly available packages, designed for integration with other libraries or applications.
These packages are deployed to the official npm repository under the `@ledgerhq` organization.

<details><summary><b>Ledger Live Libraries</b></summary>
<br/>
<p>

| Name                                                                                                                                                         | Alias                          | Umbrella                                                                       | Package                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**@ledgerhq/ledger-live-common**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledger-live-common)                                             | `pnpm common`                  | -----                                                                          |
| ----                                                                                                                                                         | -----                          | -----                                                                          | -------                                                                                                                                                       |
| [**@ledgerhq/cryptoassets**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/cryptoassets)                                       | `pnpm ljs:cryoptoassets`       | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/cryptoassets.svg)](https://www.npmjs.com/package/@ledgerhq/cryptoassets)                                       |
| [**@ledgerhq/devices**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/devices)                                                 | `pnpm ljs:devices`             | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/devices.svg)](https://www.npmjs.com/package/@ledgerhq/devices)                                                 |
| [**@ledgerhq/errors**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/errors)                                                   | `pnpm ljs:errors`              | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/errors.svg)](https://www.npmjs.com/package/@ledgerhq/errors)                                                   |
| [**@ledgerhq/hw-app-algorand**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-algorand)                                 | `pnpm ljs:hw-app-algorand`     | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-algorand.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-algorand)                                 |
| [**@ledgerhq/hw-app-btc**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-btc)                                           | `pnpm ljs:hw-app-btc`          | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-btc.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-btc)                                           |
| [**@ledgerhq/hw-app-cosmos**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-cosmos)                                     | `pnpm ljs:hw-app-cosmos`       | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-cosmos.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-cosmos)                                     |
| [**@ledgerhq/hw-app-eth**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-eth)                                           | `pnpm ljs:hw-app-eth`          | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-eth.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-eth)                                           |
| [**@ledgerhq/hw-app-helium**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-helium)                                     | `pnpm ljs:hw-app-helium`       | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-helium.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-helium)                                     |
| [**@ledgerhq/hw-app-polkadot**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-polkadot)                                 | `pnpm ljs:hw-app-polkadot`     | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-polkadot.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-polkadot)                                 |
| [**@ledgerhq/hw-app-solana**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-solana)                                     | `pnpm ljs:hw-app-solana`       | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-solana.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-solana)                                     |
| [**@ledgerhq/hw-app-str**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-str)                                           | `pnpm ljs:hw-app-str`          | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-str.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-str)                                           |
| [**@ledgerhq/hw-app-tezos**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-tezos)                                       | `pnpm ljs:hw-app-tezos`        | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-tezos.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-tezos)                                       |
| [**@ledgerhq/hw-app-trx**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-trx)                                           | `pnpm ljs:hw-app-trx`          | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-trx.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-trx)                                           |
| [**@ledgerhq/hw-app-xrp**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-xrp)                                           | `pnpm ljs:hw-app-xrp`          | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-xrp.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-xrp)                                           |
| [**@ledgerhq/hw-transport**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport)                                       | `pnpm ljs:hw-transport`        | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport)                                       |
| [**@ledgerhq/hw-transport-http**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-http)                             | `pnpm ljs:hw-transport-http`   | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-http.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-http)                             |
| [**@ledgerhq/hw-transport-mocker**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-mocker)                         | `pnpm ljs:hw-transport-mocker` | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-mocker.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-mocker)                         |
| [**@ledgerhq/hw-transport-node-ble**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-node-ble)                     | `pnpm ljs:hw-transport-node`   | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-node-ble.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-node-ble)                     |
| [**@ledgerhq/hw-transport-node-hid**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-node-hid)                     | `pnpm ljs:hw-transport-node`   | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-node-hid.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-node-hid)                     |
| [**@ledgerhq/hw-transport-node-hid-noevents**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-node-hid-noevents)   | `pnpm ljs:hw-transport-node`   | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-node-hid-noevents.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-node-hid-noevents)   |
| [**@ledgerhq/hw-transport-node-hid-singleton**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-node-hid-singleton) | `pnpm ljs:hw-transport-node`   | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-node-hid-singleton.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-node-hid-singleton) |
| [**@ledgerhq/hw-transport-node-speculos**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-node-speculos)           | `pnpm ljs:hw-transport-node`   | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-node-speculos.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-node-speculos)           |
| [**@ledgerhq/hw-transport-node-speculos-http**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-node-speculos-http) | `pnpm ljs:hw-transport-node`   | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-node-speculos-http.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-node-speculos-http) |
| [**@ledgerhq/hw-transport-web-ble**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-web-ble)                       | `pnpm ljs:hw-transport-web`    | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-web-ble.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-web-ble)                       |
| [**@ledgerhq/hw-transport-webhid**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-webhid)                         | `pnpm ljs:hw-transport-webhid` | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-webhid.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-webhid)                         |
| [**@ledgerhq/hw-transport-webusb**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-webusb)                         | `pnpm ljs:hw-transport-webusb` | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-webusb.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-webusb)                         |
| [**@ledgerhq/logs**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/logs)                                                       | `pnpm ljs:logs`                | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/logs.svg)](https://www.npmjs.com/package/@ledgerhq/logs)                                                       |
| [**@ledgerhq/react-native-hid**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/react-native-hid)                               | `pnpm ljs:react-native-hid`    | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/react-native-hid.svg)](https://www.npmjs.com/package/@ledgerhq/react-native-hid)                               |
| [**@ledgerhq/react-native-hw-transport-ble**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/react-native-hw-transport-ble)     | `pnpm ljs:react-native-hw`     | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/react-native-hw-transport-ble.svg)](https://www.npmjs.com/package/@ledgerhq/react-native-hw-transport-ble)     |
| [**@ledgerhq/types-cryptoassets**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/types-cryptoassets)                           | `pnpm ljs:types-cryptoassets`  | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/types-cryptoassets.svg)](https://www.npmjs.com/package/@ledgerhq/types-cryptoassets)                           |
| [**@ledgerhq/types-devices**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/types-devices)                                     | `pnpm ljs:types-devices`       | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/types-devices.svg)](https://www.npmjs.com/package/@ledgerhq/types-devices)                                     |
| [**@ledgerhq/types-live**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/types-live)                                           | `pnpm ljs:types-live`          | [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs) | [![npm](https://img.shields.io/npm/v/@ledgerhq/types-live.svg)](https://www.npmjs.com/package/@ledgerhq/types-live)                                           |
| ----                                                                                                                                                         | -----                          | -----                                                                          | -------                                                                                                                                                       |
| [**@ledgerhq/icons-ui**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui/packages/icons)                                                        | `pnpm ui:icons`                | [ui](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui)             | [![npm](https://img.shields.io/npm/v/@ledgerhq/icons-ui.svg)](https://www.npmjs.com/package/@ledgerhq/icons-ui)                                               |
| [**@ledgerhq/native-ui**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui/packages/native)                                                      | `pnpm ui:native`               | [ui](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui)             | [![npm](https://img.shields.io/npm/v/@ledgerhq/native-ui.svg)](https://www.npmjs.com/package/@ledgerhq/native-ui)                                             |
| [**@ledgerhq/react-ui**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui/packages/react)                                                        | `pnpm ui:react`                | [ui](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui)             | [![npm](https://img.shields.io/npm/v/@ledgerhq/react-ui.svg)](https://www.npmjs.com/package/@ledgerhq/react-ui)                                               |
| [**@ledgerhq/ui-shared**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui/packages/shared)                                                      | `pnpm ui:shared`               | [ui](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui)             | [![npm](https://img.shields.io/npm/v/@ledgerhq/ui-shared.svg)](https://www.npmjs.com/package/@ledgerhq/ui-shared)                                             |

</p>
</details>

### `/tools` - Tools

> ⚠️ Tools are primarily intended for internal use and are largely undocumented.

A tool can be a github action, a shell script or a piece of JavaScript code that is used throughout this repository.

## Contributing

Please check the general guidelines for contributing to Ledger Live projects: [`CONTRIBUTING.md`](https://github.com/LedgerHQ/ledger-live/blob/develop/CONTRIBUTING.md).

Each individual project may include its own specific guidelines, located within its respective folder.

While you explore these projects, here are some key points to keep in mind:

- Follow the git workflow, prefix your branches and do not create unnecessary merge commits.
- Be mindful when creating Pull Requests, clearly specify the purpose of your changes and include tests where applicable.
- Ledger Applications are mostly accepting bugfix contributions. Feature contributions are subject to review; they may be declined if they don't align with our roadmap or our long-term objectives.

## Nightly Releases

Every night a github action merges the `develop` branch into the `nightly` branch.

For more information on the nightly releases, have a look at our [wiki](https://github.com/LedgerHQ/ledger-live/wiki/Release-Process#nightlies).

### Ledger Live Desktop

- Every commit [triggers a workflow](https://github.com/LedgerHQ/ledger-live/actions/workflows/build-desktop.yml) that will build and attach the application binaries to the run.
- _For Ledger Employees:_ Nightly releases are built every night under the protected [ledger-live-build](https://github.com/LedgerHQ/ledger-live-build) repository.

### Ledger Live Mobile

- Every commit [triggers a workflow](https://github.com/LedgerHQ/ledger-live/actions/workflows/build-mobile.yml) that will build and attach the `Android` apk to the run.
- _For Ledger Employees:_ Nightly releases are built and published every night to [Testflight](https://developer.apple.com/testflight/) and the [Google Play Console](https://play.google.com/console).

### Libraries

Nightly versions of library packages are pushed every night to npm.

To install a nightly library use the `@nightly` dist-tag.

```sh
npm i @ledgerhq/live-common@nightly
```

## License

Please check each project `LICENSE` file, most of them are under the `MIT` license.
