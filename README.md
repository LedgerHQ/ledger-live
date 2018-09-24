# ledger-live-mobile

Mobile application for the Ledger Wallet

## Pre-requisite

- Yarn

### iOS

- XCode
- Carthage: brew install carthage

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

#### `yarn test`

#### `yarn run ios`

or `open ios/ledgerlivemobile.xcodproj`

#### `yarn run android`

or open `android/` in Android Studio.

## Environment variables

You can create a .env with following optional variables

```
DEBUG_COMM_HTTP_PROXY=http://localhost:8435   # enable a dev mode to use the device over HTTP. use with https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-http-proxy-devserver
DEBUG_MOCK_ACCOUNT=12       # enable a "generate mock accounts" button in Settings that will create this number of accounts.
BRIDGESTREAM_DATA=...       # come from console.log of the desktop app during the qrcode export. allow to bypass the bridgestream scanning
READ_ONLY=0                 # re-enable screens which have been disabled for MVP (transfer and manager)
```

## Troobleshooting

### XCode 10

When trying to build with XCode 10 and React Native v0.57.0, you might have issues with third party packages from React Native.  
To solve this issue you must:

```sh
cd ledger-live-mobile
./node_modules/react-native/scripts/ios-install-third-party.sh
```

You can them remove the `third-party` folder created at the root of your project.
The build on XCode 10 should work then.
