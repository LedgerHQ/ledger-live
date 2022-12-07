**[We are hiring, join us! 👨‍💻👩‍💻](https://jobs.lever.co/ledger/?department=Engineering)**

# Ledger Live (desktop)

- Related: [ledger-live-mobile](https://github.com/LedgerHQ/ledger-live/tree/develop/apps/ledger-live-mobile)
- Backed by: [ledger-live-common](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledger-live-common)

> Ledger Live is a new generation wallet desktop application providing a unique interface to maintain multiple cryptocurrencies for your Ledger Nano S / Blue. Manage your device, create accounts, receive and send cryptoassets, [...and many more](https://www.ledger.com/ledger-launches-ledger-live-the-all-in-one-companion-app-to-your-ledger-device).

<a href="https://github.com/LedgerHQ/ledger-live-desktop/releases">
  <p align="center">
    <img src="./docs/screenshot.png" width="550"/>
  </p>
 </a>

## Architecture

Ledger Live desktop is an hybrid application built using Electron, React, Redux, RxJS. It is compatible with macOS 10.10+, Windows 8+ (x64) and Linux (x64). It communicates to Ledger hardware wallet devices (Nano X / Nano S / Blue) to verify address and sign transactions with [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs). Some logic is shared with [live-common](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledger-live-common).

## Download

The latest stable release is available on [ledger.com/ledger-live](https://www.ledger.com/ledger-live/).

Previous versions and pre-releases can be downloaded on here from the [Releases](https://github.com/LedgerHQ/ledger-live/releases) section.

### Compatibility

- macOS 10.14+
- Windows 8.1+ (x64)
- Linux (x64)

## Signed hashes

Ledger Live releases are signed. The automatic update mechanism makes use of the signature to verify that each subsequent update is authentic. Instructions for verifying the hash and signatures of the installation packages are available [on this page](https://ledger-live-tools.now.sh/lld-signatures), which will be integrated into the [official download page](https://www.ledger.com/ledger-live/download).

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

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      // Start live desktop with:
      //ELECTRON_ARGS=--remote-debugging-port=8315 pnpm dev:lld
      "name": "Attach Electron Renderer",
      "type": "chrome",
      "request": "attach",
      "port": 8315
    },
    {
      // Start live desktop with:
      //LEDGER_INTERNAL_ARGS=--inspect pnpm dev:lld
      "name": "Attach Electron Main",
      "type": "node",
      "request": "attach",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Tips

- #### **Can't find Node.js binary "pnpm": path does not exist. Make sure Node.js is installed and in your PATH, or set the "runtimeExecutable" in your launch.json\***

  Add your terminal PATH as enviroment variable.

  ```json
    "env": {
      "ELECTRON_ARGS": "--remote-debugging-port=8315",
      "PATH": "...",
    }
  ```

  To get the PATH run in your terminal

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

other envs can be seen in [live-common:src/env.ts](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledger-live-common/src/env.ts)

### Run tests

> Reminder: all commands should be run at the root of the monorepository

```bash
pnpm desktop test
```

### Run code quality checks

```bash
pnpm desktop test:codecheck
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
│   ├── index.html : html point point
│   ├── index.js : js entry point
│   ├── init.js : initialize the rendering
│   ├── live-common-setup.js : set up live-common for renderer specific parts
│   └── ... other files related to renderer
├── config : constants files. DEPRECATED. will be moved to live-common.
├── helpers : helpers. DEPRECATED. will be moved to live-common or in relevant places.
├── live-common-set-supported-currencies.js : generic set up of supported coins
├── live-common-setup.js : generic set up of live-common
├── logger : internal logging library. used by all thread. produces the "export logs".
├── network.js : network implementation. will eventually move back to live-common.
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
