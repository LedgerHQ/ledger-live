#!/bin/bash

cd $(dirname $0)/..

bundle install

if [ "$(uname)" == "Darwin" ]; then
  (
    cd ios && bundle exec pod install --deployment --repo-update
  )
fi

# ./scripts/sync-families-dispatch.sh

# patch --forward -i scripts/RCTCoreOperationQuery.java.patch node_modules/@ledgerhq/react-native-ledger-core/android/src/main/java/com/ledger/reactnative/RCTCoreOperationQuery.java

# rm -f 'third-party/glog-0.3.5/test-driver'

# Had to remove the following because we already have the AsyncSocket lib as a dependency from Flipper 🐬
# Why would anyone bundle an external lib available on CocoaPods anyway?
# It's been fixed in https://github.com/tradle/react-native-udp/pull/112 but as of today it's not part of any release
rm -rf "node_modules/react-native-tcp/ios/CocoaAsyncSocket"



# issue: https://github.com/WalletConnect/walletconnect-monorepo/issues/595
# manually shim
#sed -i -- 's/require("crypto")/require("react-native-crypto")/g' node_modules/@walletconnect/randombytes/dist/cjs/node/index.js


# Create the dev .env file with APP_NAME if it doesn't exist
# if ! [ -f .env ]; then
#   echo 'APP_NAME="LL [DEV]"' >.env
# fi

git apply --stat --apply patches/detox.patch
