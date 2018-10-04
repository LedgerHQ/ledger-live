#!/bin/bash

set -e

if [ -z "$ANDROID_HOME" ]; then
  echo "ANDROID_HOME environnement variable not found. Please set it to your Android SDK root folder."
  exit 1
fi

if [ -z "$ANDROID_KEYSTORE" ]; then
  echo "Please set ANDROID_KEYSTORE environnement variable to your keystore file path."
  exit 1
fi

echo "--- BUILD UNSIGNED APP ---"
# Build unsigned app
cd android
./gradlew assembleRelease

# Get the latest installed build tools
TOOLS_FOLDER="$($ANDROID_HOME/tools/bin/sdkmanager --list | sed '/Available Packages/q' | egrep -o 'build-tools\/[0-9\.]+\/' | tail -1)"
TOOLS_FOLDER_ABS="${ANDROID_HOME}/${TOOLS_FOLDER}"

echo "--- SIGN APP USING $TOOLS_FOLDER ---"

# Sign app
cd app/build/outputs/apk/release/
rm -f app-release-unsigned-aligned.apk
$TOOLS_FOLDER_ABS/zipalign -v -p 4 app-release-unsigned.apk app-release-unsigned-aligned.apk
$TOOLS_FOLDER_ABS/apksigner sign --ks "$ANDROID_KEYSTORE" --out ledger-live-release.apk app-release-unsigned-aligned.apk
rm app-release-unsigned.apk app-release-unsigned-aligned.apk

echo "Done."
echo "Your signed release build is available in $(pwd)"
