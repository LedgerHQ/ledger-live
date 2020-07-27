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
- Yarn 1.10.1 or above

### iOS

- XCode

### Android

- Android Studio

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

or `open ios/ledgerlivemobile.xcworkspace`

### `yarn run android`

or open `android/` in Android Studio.

### `yarn android:clean`

Delete the application data for Ledger Live Mobile, equivalent to doing it manually through settings

### `yarn android:import importDataString`

Passing a base64 encoded export string (the export from desktop) will trigger an import activity and allow
easy data setting for development.

## Environment variables

Optional environment variables you can put in `.env`, `.env.production` or `.env.staging` for debug, release, or staging release builds respectively.

```
DEVICE_PROXY_URL=http://localhost:8435   # enable a dev mode to use the device over HTTP. use with https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-http-proxy-devserver
BRIDGESTREAM_DATA=...       # come from console.log of the desktop app during the qrcode export. allow to bypass the bridgestream scanning
DEBUG_RNDEBUGGER=1          # enable react native debugger
DISABLE_READ_ONLY=1         # disables readonly mode by default
```

## Maintenance

### Refresh the flow-typed from flow-typed Github

```
yarn sync-flowtyped
```

### Refresh the languages (when we add new languages)

```
yarn sync-locales
```

## Debugging

### Javascript / React

It's recommended to use [react-native-debugger](https://github.com/jhen0409/react-native-debugger) instead of Chrome dev tools as it features some additional React and Redux panels.

- Get the react-native-debugger app from the [official repo](https://github.com/jhen0409/react-native-debugger)
- Run it
- Run Ledger Live Mobile in debug mode (`yarn ios` or `yarn android`)
- Open React Native _Development menu_ (shake gesture)
- Chose _Enable Remote JS Debugging_

Keep in mind that doing so will run your Javascript code on a Chromium JS engine ([V8](https://v8.dev/)) on your computer, instead of iOS' system JS engine (JavaScript Core), or our bundled JS engine (JSC for now, soon to be replaced with [Hermes](https://github.com/facebook/hermes)) on Android.

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

### Deep Linking 🔗

Several URI schemes are available for deep linking from external sources
They all are prefixed by **_ledgerlive://_**

- **_portfolio_** 🠒 Portfolio page
- **_account?curency_** 🠒 Account Page
- **_send?currency_** 🠒 Send Flow
- **_receive?currency_** 🠒 Receive Flow
- **_buy/:currency_** 🠒 Buy Crypto Flow

**_Testing on android_** in order to test in debug your link run using [**_adb_**](https://developer.android.com/training/app-links/deep-linking#testing-filters)

```
  adb shell am start -W -a android.intent.action.VIEW -d "ledgerlive://{{YOUR_URL}}" com.ledger.live.debug
```

**_Testing on ios_** in order to test your link run using xcrun

```
  xcrun simctl openurl booted ledgerlive://{{YOUR_URL}}
```

**_Testing through browser_**

run

```
yarn run test-deep-links
```

Then go to the provided link in order to see a test web page.
For this either redirect the :8000 port on your chrome remote device settings or use the network link provided by the command.
