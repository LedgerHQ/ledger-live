#!/bin/bash

# replace the package name com.ledger.live by com.ledger.live.debug in
# AndroidManifest.xml as `react-native profile-hermes` is a bit too dumb to
# get the right package name derived from the appIdSuffix
if [ "$(uname)" == "Darwin" ]; then
  sed -i '' 's/package="com.ledger.live"/package="com.ledger.live.debug"/g' ./android/app/src/main/AndroidManifest.xml
else
  sed -i 's/package="com.ledger.live"/package="com.ledger.live.debug"/g' ./android/app/src/main/AndroidManifest.xml
fi

npx react-native profile-hermes\
  --sourcemap-path './android/app/build/intermediates/sourcemaps/react/debug/index.android.bundle.packager.map'\
  $1 #optional destination directory, will be "." by default

echo "Two ways to inspect this file:"
echo '  - open chrome devtools, go to the "Performance" tab and load the file'
echo '  - open chrome, navigate to chrome://tracing and load the file'

# put back AndroidManifest.xml as it was
if [ "$(uname)" == "Darwin" ]; then
  sed -i '' 's/package="com.ledger.live.debug"/package="com.ledger.live"/g' ./android/app/src/main/AndroidManifest.xml
else
  sed -i 's/package="com.ledger.live.debug"/package="com.ledger.live"/g' ./android/app/src/main/AndroidManifest.xml
fi


