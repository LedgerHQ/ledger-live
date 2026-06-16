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

To run tests in parallel set the desired amount of workers with `WDIO_INSTANCES`.

For example, to run specs with 3 emulators in parallel simple follow these steps:

1. Boot all 3 emulators (Android) / simulators (iOS)
2. Set the env var in your terminal: `export WDIO_INSTANCES=3`
3. Launch the tests for the relevant patform, eg `pnpm android`
