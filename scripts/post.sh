#!/bin/bash

cd $(dirname $0)/..

./scripts/sync-families-dispatch.sh

patch --forward -i scripts/RCTCoreOperationQuery.java.patch node_modules/@ledgerhq/react-native-ledger-core/android/src/main/java/com/ledger/reactnative/RCTCoreOperationQuery.java
cp scripts/RNAnalyticsModule.kt node_modules/@segment/analytics-react-native/android/src/main/java/com/segment/analytics/reactnative/core/RNAnalyticsModule.kt 

rm -f 'node_modules/@segment/analytics-ios/.clang-format' 'third-party/glog-0.3.5/test-driver'

# Had to remove the following because we already have the AsyncSocket lib as a dependency from Flipper 🐬
# Why would anyone bundle an external lib available on CocoaPods anyway?
rm -rf "node_modules/react-native-udp/ios/CocoaAsyncSocket" "node_modules/react-native-tcp/ios/CocoaAsyncSocket"

rn-nodeify --hack

# Create the dev .env file with APP_NAME if it doesn't exist
if ! [ -f .env ]; then
  echo 'APP_NAME="LL [DEV]"' >.env
fi

if [[ $DEBUG_RNDEBUGGER == "1" ]]; then
  rndebugger-open
fi

if [ "$(uname)" == "Darwin" ]; then
  if ! [ -x "$(command -v bundle)" ]; then
    echo 'Error: `bundle` command is missing. Please install Bundler. https://bundler.io' >&2
    exit 1
  fi

  bundle install
  cd ios && bundle exec pod install --deployment --repo-update

  if [ $? -ne 0 ]; then
    echo "
     _________________________________________
    / CocoaPods lockfile is probably out of   \\
    | sync with native dependencies. Don't    |
    | forget to run \`yarn pod\` after adding   |
    | or updating dependencies, and commit    |
    \\ the changes in Podfile.lock.            /
     -----------------------------------------
      \\
       \\
         __
        /  \\
        |  |
        @  @
        |  |
        || |/
        || ||
        |\\_/|
        \\___/
    " >&2
    exit 1
  fi
fi

# We manually need to run Jetifier for React Native BLE PLX until they switch to AndroidX
# https://github.com/Polidea/react-native-ble-plx#android-example-setup
yarn jetify
