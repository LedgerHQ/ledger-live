#!/bin/bash

set -e

if [ -z "$ANDROID_HOME" ]; then
  echo "ANDROID_HOME environnement variable not found. Please set it to your Android SDK root folder."
  exit 1
fi

if [[ $1 ]]; then
  BUILD_TYPE=$1
else
  BUILD_TYPE="stagingRelease"
fi

ADB="$ANDROID_HOME/platform-tools/adb"
ABI=`$ADB shell getprop ro.product.cpu.abi`
APK="android/app/build/outputs/apk/${BUILD_TYPE}/app-${ABI}-${BUILD_TYPE}.apk"

echo "Installing $APK"

$ADB install -r $APK

APP_ID=`$ANDROID_HOME/tools/bin/apkanalyzer manifest application-id $APK`

$ADB shell monkey -p $APP_ID 1 &> /dev/null
