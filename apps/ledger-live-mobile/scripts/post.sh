#!/bin/bash

cd $(dirname $0)/..

./scripts/sync-families-dispatch.sh

# See: https://github.com/expo/expo/issues/15622#issuecomment-997225774
# patch -N -i scripts/patches/RNAnalytics.h.patch node_modules/@segment/analytics-react-native/ios/RNAnalytics/RNAnalytics.h
patch -N -i scripts/patches/RNFastCrypto.h.patch node_modules/react-native-fast-crypto/ios/RNFastCrypto.h

# patching transitive gradle dependency
patch -N -i ./scripts/patches/react-native-video.2575.patch node_modules/react-native-video/android-exoplayer/src/main/java/com/brentvatne/exoplayer/ReactExoplayerView.java
patch -N -i ./scripts/patches/react-native-video+5.2.0.patch node_modules/react-native-video/android-exoplayer/build.gradle

rm -f 'third-party/glog-0.3.5/test-driver'

# Had to remove the following because we already have the AsyncSocket lib as a dependency from Flipper 🐬
# Why would anyone bundle an external lib available on CocoaPods anyway?
# It's been fixed in https://github.com/tradle/react-native-udp/pull/112 but as of today it's not part of any release
rm -rf "node_modules/react-native-tcp/ios/CocoaAsyncSocket"

# issue: https://github.com/WalletConnect/walletconnect-monorepo/issues/595
# manually shim
# sed -i -- 's/require("crypto")/require("react-native-crypto")/g' node_modules/@walletconnect/randombytes/dist/cjs/node/index.js

# Create the dev .env file with APP_NAME if it doesn't exist
if ! [ -f .env ]; then
  echo 'APP_NAME="LL [DEV]"' >.env
fi

if [[ $DEBUG_RNDEBUGGER == "1" ]]; then
  rndebugger-open
fi

if ! [ -x "$(command -v bundle)" ]; then
  echo 'Error: `bundle` command is missing. Please install Bundler. https://bundler.io' >&2
  exit 1
fi
bundle install

if [ "$(uname)" == "Darwin" ]; then
  # (
  #   cd node_modules/react-native/scripts
  #   echo "- switch to relative paths in react_native_pods.rb "
  #   sed -i '' -e "s/File[.]join[(]__dir__, \"[.][.]\"[)]/\"..\/..\/node_modules\/react-native\"/" react_native_pods.rb
  #   sed -i '' -e "s/#{File[.]join[(]__dir__, \"generate-specs.sh\"[)]}/..\/..\/node_modules\/react-native\/scripts\/generate-specs.sh/" react_native_pods.rb
  #   sed -i '' -e "s/spec[.]prepare_command = \"#/spec.prepare_command = \"cd ..\/.. \&\& #/" react_native_pods.rb
  # )

  (
    cd ios && bundle exec pod install --deployment --repo-update
  )

  if [ $? -ne 0 ]; then
    echo "
     _________________________________________
    / CocoaPods lockfile is probably out of   \\
    | sync with native dependencies. Don't    |
    | forget to run \`pnpm pod\` after adding   |
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
pnpm jetify
