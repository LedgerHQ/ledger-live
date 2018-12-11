# ledger-live-mobile

Mobile application for the Ledger Wallet

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

#### `yarn test`

#### `yarn run ios`

or `open ios/ledgerlivemobile.xcodproj`

#### `yarn run android`

or open `android/` in Android Studio.

## Environment variables

Optional environment variables you can put in `.env`, `.env.production` or `.env.staging` for debug, release, or staging release builds respectively

```
DEBUG_COMM_HTTP_PROXY=http://localhost:8435   # enable a dev mode to use the device over HTTP. use with https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-http-proxy-devserver
BRIDGESTREAM_DATA=...       # come from console.log of the desktop app during the qrcode export. allow to bypass the bridgestream scanning
DEBUG_RNDEBUGGER=1          # enable react native debugger
DISABLE_READ_ONLY=1         # disables readonly mode by default
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

### Release on testflight

currently it is manually done with XCode.

save your own .env somewhere and do:

```
cp .env.staging .env
```

- go to XCode.
- manually increment the Build number in ledgerlivemobile Target.
- go to Build Phases, expand Copy Files and remove ledger-core.framework from the list.
- select Generic iOS Device target and do a Product > Archive.
- The Archives window will open, click on Distribute App and follow the steps.
  - if you miss a certificate problem, please contact gre.
- commit the Info.plist but NOT the ledgerlivemobile.xcodeproj changes.

## Troubleshooting

### XCode 10

When trying to build with XCode 10 and React Native v0.57.0, you might have issues with third party packages from React Native.  
To solve this issue you must:

```sh
./node_modules/react-native/scripts/ios-install-third-party.sh
```

The build on XCode 10 should work then.
