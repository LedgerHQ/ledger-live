# WDIO POC

## Introduction

To learn more about the POC please see the [Comparison Page](https://ledgerhq.atlassian.net/wiki/spaces/QA/pages/7103905919/E2E+Mobile+Comparison).

## Running tests

This is a POC in progress, detailed docs will follow depending on POC outcome.

Until then please build the release app and execute tests from the poc-wdio directory:

```bash
# ANDROID
$ pnpm android

# iOS
$ pnpm ios
```

## Running tests in parallel

WDIO handles parallel worker delegation out of the box.

To run tests in parallel set the desired amount of workers with `E2E_WDIO_INSTANCES`.

For example, to run specs with 3 emulators in parallel follow these steps:

1. Boot all 3 emulators (Android) / simulators (iOS)
2. Set the env var in your terminal: `export E2E_WDIO_INSTANCES=3`
3. Launch the tests for the relevant patform, eg `pnpm android`

## Running tests in debug mode

Running the app in debug mode allows us to see bridge logs, inspect the UI, etc.

1. Set the debug env var in your terminal: `export E2E_DEBUG_APP=true`
2. Launch a test for the relevant patform, eg `pnpm android --spec specs/swapETH_ETH_USDT.spec.ts`

## Pointing to a specific platform version

It is possible to point to a custom Android or iOS platform version.

Just set the relevant env var:

```bash
# ANDROID
export E2E_WDIO_ANDROID_VERSION="16.0"

# IOS
export E2E_WDIO_IOS_VERSION="26.3"
```
