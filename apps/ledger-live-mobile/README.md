**[We are hiring, join us! 👨‍💻👩‍💻](https://jobs.lever.co/ledger/?department=Engineering)**

# ledger-live-mobile

- Related: [ledger-live-desktop](https://github.com/LedgerHQ/ledger-live-desktop)

> Ledger Live is a mobile companion app for Ledger hardware wallets. It allows users to manage their crypto assets securely, such as Bitcoin, Ethereum, XRP and many others. Ledger Live mobile is available for [iOS](https://itunes.apple.com/fr/app/id1361671700) and [Android](https://play.google.com/store/apps/details?id=com.ledger.live).

![](https://user-images.githubusercontent.com/211411/51758554-42edb980-20c6-11e9-89f0-308949a760d6.png)

## Architecture

Ledger Live is a native mobile application built with React Native, React, Redux, RxJS, etc. and some native libraries.
The architecture is analog to the [desktop application](https://github.com/LedgerHQ/ledger-live-desktop) and also uses our C++ library, [lib-ledger-core](https://github.com/LedgerHQ/lib-ledger-core), to deal with blockchains (sync, broadcast...) via [ledger-core-react-native-bindings](https://github.com/LedgerHQ/lib-ledger-core-react-native-bindings).
It communicates with the [Ledger Nano X](https://www.ledger.com/pages/ledger-nano-x) via Bluetooth (or USB for using the Ledger Nano S on Android) to manage installed applications, update the device firmware, verify public addresses and sign transactions with [ledgerjs](https://github.com/LedgerHQ/ledgerjs). We also share some logic in [live-common](https://github.com/LedgerHQ/ledger-live-common).

![](https://user-images.githubusercontent.com/211411/51758555-43865000-20c6-11e9-8ac9-06787ebb49eb.png)

# Developing on ledger-live-mobile

## Pre-requisites

- Node LTS version
- Pnpm

### iOS

- XCode

### Android

- Android Studio

## Scripts

### `pnpm install`

install dependencies.

### `pnpm start`

Runs your app in development mode.

Sometimes you may need to reset or clear the React Native packager's cache. To do so, you can pass the `--reset-cache` flag to the start script:

```
pnpm start -- --reset-cache
```

### `pnpm test`

### `pnpm run ios`

or `open ios/ledgerlivemobile.xcworkspace`

### `pnpm run android`

or open `android/` in Android Studio.

### `pnpm android:clean`

Delete the application data for Ledger Live Mobile, equivalent to doing it manually through settings

### `pnpm android:import importDataString`

Passing a base64 encoded export string (the export from desktop) will trigger an import activity and allow
easy data setting for development.

## Environment variables

Optional environment variables you can put in `.env`, `.env.production` or `.env.staging` for debug, release, or staging release builds respectively.

[A more exhaustive list of documented environment variables can be found here](https://github.com/LedgerHQ/ledger-live-common/blob/master/src/env.ts).

- `DEVICE_PROXY_URL=http://localhost:8435` Use the ledger device over HTTP. Useful for debugging on an emulator. More info about this in the section [Connection via HTTP bridge](#connection-via-http-bridge).
- `BRIDGESTREAM_DATA=...` Come from console.log of the desktop app during the qrcode export. allow to bypass the bridgestream scanning.
- `DEBUG_RNDEBUGGER=1` Enable react native debugger.
- `DISABLE_READ_ONLY=1` Disable readonly mode by default.
- `SKIP_ONBOARDING=1` Skips the onboarding flow.

## Maintenance

### Refresh the flow-typed from flow-typed Github

```
pnpm sync-flowtyped
```

### Refresh the languages (when we add new languages)

```
pnpm sync-locales
```

## Debugging

### Javascript / React

It's recommended to use [react-native-debugger](https://github.com/jhen0409/react-native-debugger) instead of Chrome dev tools as it features some additional React and Redux panels.

- Get the react-native-debugger app from the [official repo](https://github.com/jhen0409/react-native-debugger)
- Run it
- Run Ledger Live Mobile in debug mode (`pnpm ios` or `pnpm android`)
- Open React Native _Development menu_ (shake gesture)
- Chose _Enable Remote JS Debugging_

Keep in mind that doing so will run your Javascript code on a Chromium JS engine ([V8](https://v8.dev/)) on your computer, instead of iOS' system JS engine (JavaScript Core), or our bundled JS engine (JSC for now, soon to be replaced with [Hermes](https://github.com/facebook/hermes)) on Android.

### End to end testing

Refer to the e2e specific [README.md](e2e/README.md)

### Native code

#### XCode / Android studio

Run the app from the Apple or Google own IDE to get some native debugging features like breakpoints etc.

### And more

#### Flipper 🐬

[Flipper](https://fbflipper.com/) has been integrated in the project, so you can use it to get additional debugging information (like network monitoring) and find other useful data you could previously get from scattered places, here neatly presented in a single interface (like logs and crash reports for both platforms).

React Native integration seems pretty bleeding edge right now, so don't expect everything to work just yet.

- Install [Flipper](https://fbflipper.com/) on your computer
- Launch it 🚀
- Run Ledger Live Mobile in debug as usual
- No need to enable remote debug!

### Working on iOS or Android emulators

#### Connection via HTTP bridge

It is possible to run Ledger Live Mobile on an emulator and connect to a Nano that is plugged in via USB.

- Install the [ledger-live cli](https://github.com/LedgerHQ/ledger-live-common/blob/master/docs/cli.md).
- Plug in your Nano to your computer.
- Run `ledger-live proxy`. A server starts and displays variable environments that can be used to build Ledger-Live Mobile. For example:
  ```
  DEVICE_PROXY_URL=ws://localhost:8435
  DEVICE_PROXY_URL=ws://192.168.1.14:8435
  Nano S proxy started on 192.168.1.14
  ```
- Either do `export DEVICE_PROXY_URL=the_adress_given_by_the_server` or paste this variable environment in the `.env` file at the root of the project (create it if it doesn't exist)
- Build & run Ledger Live Mobile `pnpm ios` or `pnpm android`
- When prompted to choose a Nano device in Ledger Live Mobile, you will see your Nano available with the adress from above, just select it and it should work normally.

### Extra Docs 📄

- [Deep Linking 🔗](./docs/linking.md)
- [UI Theming 🎨](./docs/theming.md)
