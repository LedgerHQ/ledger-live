#!/bin/bash

cd $(dirname $0)/..

./scripts/sync-families-dispatch.sh

rm -f 'node_modules/@segment/analytics-ios/.clang-format' 'third-party/glog-0.3.5/test-driver'

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
  cd ios && bundle exec pod install
fi

# We manually need to run Jetifier for React Native BLE PLX until they switch to AndroidX
# https://github.com/Polidea/react-native-ble-plx#android-example-setup
yarn jetify
