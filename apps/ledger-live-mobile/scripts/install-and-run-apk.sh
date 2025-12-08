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

# Detect apkanalyzer path (cmdline-tools for newer SDK, tools for older SDK)
if [ -d "$ANDROID_HOME/cmdline-tools/latest/bin" ]; then
  APKANALYZER="$ANDROID_HOME/cmdline-tools/latest/bin/apkanalyzer"
elif [ -d "$ANDROID_HOME/cmdline-tools" ]; then
  # Handle versioned cmdline-tools (e.g., cmdline-tools/11.0)
  CMDLINE_VERSION=$(ls "$ANDROID_HOME/cmdline-tools" | head -1)
  APKANALYZER="$ANDROID_HOME/cmdline-tools/$CMDLINE_VERSION/bin/apkanalyzer"
elif [ -d "$ANDROID_HOME/tools/bin" ]; then
  APKANALYZER="$ANDROID_HOME/tools/bin/apkanalyzer"
else
  echo "Error: Could not find apkanalyzer. Please ensure Android SDK command-line tools are installed."
  exit 1
fi

echo "Installing $APK"

$ADB install -r $APK

APP_ID=`$APKANALYZER manifest application-id $APK`

$ADB shell monkey -p $APP_ID 1 &> /dev/null
