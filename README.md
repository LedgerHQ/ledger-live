# ledger-live-mobile

- Related: [ledger-live-desktop](https://github.com/LedgerHQ/ledger-live-desktop)

> Ledger Live is a mobile companion for Ledger Hardware wallets. It allows to manage crypto assets (Bitcoin, Ethereum, Ripple and many others) securely. Available for [iOS](https://itunes.apple.com/fr/app/id1361671700) and [Android](https://play.google.com/store/apps/details?id=com.google.android.apps.live).

![](https://user-images.githubusercontent.com/211411/51758554-42edb980-20c6-11e9-89f0-308949a760d6.png)

## Architecture

Ledger Live (mobile) is a native mobile application built with React Native, React, Redux, RxJS,.. and some native libraries. The architecture is analog to the [desktop application](https://github.com/LedgerHQ/ledger-live-desktop) and also use our C++ library, the [lib-ledger-core](https://github.com/LedgerHQ/lib-ledger-core) to deal with blockchains (sync, broadcast,..) via [ledger-core-node-bindings](https://github.com/LedgerHQ/lib-ledger-core-react-native-bindings). It communicates in Bluetooth to the brand new [Ledger Nano X](https://www.ledger.com/pages/ledger-nano-x) to manager applications and firmware, verify address and sign transactions with [ledgerjs](https://github.com/LedgerHQ/ledgerjs). We also share some logic in [live-common](https://github.com/LedgerHQ/ledger-live-common).

![](https://user-images.githubusercontent.com/211411/51758555-43865000-20c6-11e9-8ac9-06787ebb49eb.png)

# Developing on ledger-live-mobile

## Pre-requisite

- Node LTS version
- Yarn 1.10.1 or above

### iOS

- XCode

### Android

- Android studio

## Scripts

### `yarn install`

install dependencies.

### `yarn start`

Runs your app in development mode.

Sometimes you may need to reset or clear the React Native packager's cache. To do so, you can pass the `--reset-cache` flag to the start script:

```
yarn start -- --reset-cache
```

### `yarn test`

### `yarn run ios`

or `open ios/ledgerlivemobile.xcodproj`

### `yarn run android`

or open `android/` in Android Studio.

## Environment variables

Optional environment variables you can put in `.env`, `.env.production` or `.env.staging` for debug, release, or staging release builds respectively

```
DEBUG_COMM_HTTP_PROXY=http://localhost:8435   # enable a dev mode to use the device over HTTP. use with https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-http-proxy-devserver
BRIDGESTREAM_DATA=...       # come from console.log of the desktop app during the qrcode export. allow to bypass the bridgestream scanning
DEBUG_RNDEBUGGER=1          # enable react native debugger
DISABLE_READ_ONLY=1         # disables readonly mode by default
EXPERIMENTAL_WS_EXPORT=1    # enables the websocket experimental import
```

## Maintenance

### Refresh the flow-typed from flow-typed Github

```
yarn sync-flowtyped
```

### Refresh the languages (if we add new languages)

```
yarn sync-locales
```

## Troubleshooting

### XCode 10

When trying to build with XCode 10 and React Native v0.57.0, you might have issues with third party packages from React Native.  
To solve this issue you must:

```sh
./node_modules/react-native/scripts/ios-install-third-party.sh
```

The build on XCode 10 should work then.
