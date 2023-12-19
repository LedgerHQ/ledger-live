**[We are hiring, join us! 👨‍💻👩‍💻](https://jobs.lever.co/ledger/?department=Tech)**

# Ledger Live (desktop)

- Related: [ledger-live-mobile](https://github.com/LedgerHQ/ledger-live/tree/develop/apps/ledger-live-mobile)
- Backed by: [ledger-live-common](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledger-live-common)

> Ledger Live is a desktop companion app for Ledger hardware wallets. It allows users to manage their crypto assets securely, such as Bitcoin, Ethereum, XRP and many others. Ledger Live desktop is available for Mac, Windows (x64) and Linux (x64). It can be downloaded from [ledger.com/ledger-live](https://www.ledger.com/ledger-live/).

Minimum system requirements can be found on [Ledger Support website](https://support.ledger.com/hc/en-us/articles/4403310017041-Ledger-Live-system-requirements-?docs=true).


<a href="https://github.com/LedgerHQ/ledger-live-desktop/releases">
  <p align="center">
    <img src="./docs/screenshot.png" width="550"/>
  </p>
 </a>

## Architecture

Ledger Live desktop is an hybrid application built using Electron, React, Redux, RxJS. It communicates with [Ledger hardware wallet devices](https://shop.ledger.com/pages/hardware-wallets-comparison) to manage installed applications, update the device firmware, verify public addresses and sign transactions with [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs).

We also share core business logic with Ledger Live mobile through [@ledgerhq/live-common](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledger-live-common) package.

## Signed hashes

Ledger Live releases are signed. The automatic update mechanism makes use of the signature to verify that each subsequent update is authentic. Instructions for verifying the hash and signatures of the installation packages are available on [Ledger Live tools website](https://live.ledger.tools/lld-signatures), which will be integrated into the [official download page](https://www.ledger.com/ledger-live).

# Development

## Setup

### Requirements

- [NodeJS](https://nodejs.org) `lts/gallium` (v16.x) + [npm](https://www.npmjs.com/)
- [PnPm](https://pnpm.io) (v7.x)
- [Python](https://www.python.org/) (v3.5+)
- A C/C++ toolchain (see [node-gyp documentation](https://github.com/nodejs/node-gyp#on-unix))
- On Linux: `sudo apt-get update && sudo apt-get install libudev-dev libusb-1.0-0-dev`

## Install

> Reminder: all commands should be run at the root of the monorepository

```bash
# install dependencies
pnpm i
```

## Run

```bash
# launch the app in dev mode
pnpm dev:lld
```

## Build

```bash
# Build & package the whole app
# Creates a .dmg for Mac, .exe installer for Windows, or .AppImage for Linux
# Output files will be created in dist/ folder

# build all the required dependencies
pnpm build:lld:deps
# then use alias to trigger the `dist` script in ledger-live-desktop project
pnpm desktop build

# or you can use the top level script (pnpm build:lld:deps not required in this case)
pnpm build:lld
```

## Debug

If you are using [Visual Studio Code](https://code.visualstudio.com/) IDE, we provide a [default debug configuration](https://github.com/LedgerHQ/ledger-live/tree/develop/.vscode/launch.json) that you can use to debug the main and renderer processes of the application.

### Tips

- #### **Can't find Node.js binary "pnpm": path does not exist. Make sure Node.js is installed and in your PATH, or set the "runtimeExecutable" in your launch.json\***

  Add your terminal PATH as environment variable.

  ```json
    "env": {
      "ELECTRON_ARGS": "--remote-debugging-port=8315",
      "PATH": "...",
    }
  ```

  To get the PATH, run in your terminal

  ```bash
  echo $PATH
  ```

---

## Config (optional helpers)

### Environment variables

(you can use a .env or export environment variables)

```bash
NO_DEBUG_COMMANDS=1
NO_DEBUG_DB=1
NO_DEBUG_ACTION=1
NO_DEBUG_TAB_KEY=1
NO_DEBUG_NETWORK=1
NO_DEBUG_ANALYTICS=1
NO_DEBUG_WS=1
NO_DEBUG_DEVICE=1
NO_DEBUG_COUNTERVALUES=1
```

Other environment variables can be found in [libs/src/env.ts](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/env/src/env.ts)

### Run tests

> Reminder: all commands should be run at the root of the monorepository

```bash
pnpm desktop test
```

### Run code quality checks

```bash
pnpm desktop lint
pnpm desktop typecheck
```

## File structure

```
src
├── main : the main process is the mother of all process. it boots internal and renderer process and starts the window.
├── internal : related to internal thread that runs commands, device logic, libcore,..
├── renderer : everything related to the UI.
│   ├── screens
│   ├── modals
│   ├── components : all components that are not screens or modals, flattened.
│   ├── animations
│   ├── icons
│   ├── images
│   ├── styles
│   ├── bridge : logic related to interacting with accounts and currencies.
│   ├── families : per currency specific logic and components
│   ├── actions : redux actions
│   ├── reducers : redux reducers
│   ├── middlewares
│   ├── analytics
│   ├── fonts
│   ├── hooks
│   ├── i18n : all translation files
|   ├── logger : internal logging library. Can be exported through the "save logs" feature.
│   ├── index.html : html entry point
│   ├── index.ts : js entry point
│   ├── init.tsx : initialize rendering
│   ├── live-common-setup.ts : set up live-common for renderer specific parts
│   └── ... other files related to renderer
├── config : constants files. DEPRECATED. Will be moved to live-common.
├── helpers : helpers. DEPRECATED. Will be moved to live-common or in relevant places.
├── live-common-set-supported-currencies.ts : generic set up of supported coins
├── live-common-setup-base.ts : generic set up of live-common
└── sentry : related to bug report API
```

## Localization / Translations

Translations from English to other languages are handled internally so it is not possible to directly contribute to them, however if you spot a bug (e.g. a wrong variable name) or any issue in translation files, feel free to report a bug to Ledger's support team and it will be taken care of.

---

## Are you adding the support of a blockchain to Ledger Live?

This part of the repository is where you will add the support of your blockchain for the desktop app.

For a smooth and quick integration:

- See the developers’ documentation on the [Developer Portal](https://developers.ledger.com/docs/coin/general-process/) and
- Go on [Discord](https://developers.ledger.com/discord-pro/) to chat with developer support and the developer community.

---
