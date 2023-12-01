#!/usr/bin/env bash

set -e

pushd "$(dirname $0)/../../.." > /dev/null
BUILD=0
TEST=0

usage() {
  echo "Usage: $(basename $0) [-h] [-p <ios|android>] [-t] [-b]" 1>&2
  exit 1
}

build_ios() {
  pnpm mobile bundle:ios --dev false --minify false
  pnpm mobile exec detox clean-framework-cache
  pnpm mobile exec detox build-framework-cache
  pushd apps/ledger-live-mobile
  cp main.jsbundle ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app/main.jsbundle
  mv main.jsbundle ios/build/Build/Products/Release-iphonesimulator/main.jsbundle
  popd
}

build_android() {
  pnpm mobile e2e:build -c android.emu.release
}

test_ios() {
   pnpm mobile e2e:test \
    -c ios.sim.release \
    --loglevel error \
    --record-logs all \
    --take-screenshots all \
    --headless \
    --retries 1 \
    --cleanup \
    --record-performance all
}

test_android() {
  pnpm mobile e2e:test \
    -c android.emu.release \
    --loglevel error \
    --record-logs all \
    --take-screenshots all \
    --forceExit \
    --headless \
    --retries 1 \
    --cleanup
}

while getopts "hp:bt" arg; do
  case $arg in
    h)
      usage
      ;;
    p)
      PLATFORM=${OPTARG}
      [ "$PLATFORM" == "ios" ] || [ "$PLATFORM" == "android" ] || usage
      ;;
    b)
      BUILD=1
      ;;
    t)
      TEST=1
      ;;
    *)
      usage
      ;;
  esac
done

if [ "$BUILD" -eq 0 ] && [ "$TEST" -eq 0 ]; then
  echo "arguments -b or -t must be provided"
  usage
fi

if [ "$BUILD" ]; then
  build_$PLATFORM
fi

if [ "$TEST" ]; then
  test_$PLATFORM
fi
