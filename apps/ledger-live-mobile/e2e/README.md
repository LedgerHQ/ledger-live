# STILL IN DEVELOPMENT :)
# ledger-live-mobile e2e testing

This project uses [Detox](https://github.com/wix/Detox) and [Jest](https://jestjs.io/) for end-to-end testing. Please refer to the documentation of those projects for the specifics. In this folder you will find the key parts for testing a flow in the application: the setup, specs and flow definitions.

## Quick Start

> Ensure you have Android Studio and Xcode installed with the relevant development/emulator tools installed (see 'Environment Setup' below).

### Base setup

Clean your local environment (the main thing this step does is remove `node_modules` and previous iOS and Android mobile app builds):

```bash
pnpm clean
```

Install dependencies:

```bash
pnpm i
```

> There is a filtered version of this command which should be quicker: `pnpm i --filter="live-mobile..." --filter="ledger-live"`. However the above `pnpm i` will make sure that everything can be run.

Build dependencies for the mobile app:

```bash
pnpm build:llm:deps
```

### Android

- Build the apps
  - Debug: `pnpm mobile e2e:build -c android.emu.debug`
  - Staging: `pnpm mobile e2e:build -c android.emu.staging`
- Run the tests
  - Debug: First, run `pnpm mobile start` in a separate window to run Metro bundler, then `pnpm mobile e2e:test -c android.emu.debug`
  - Staging: `pnpm mobile e2e:test -c android.emu.release`

### iOS

Use the exact same commands as above Android ones but replace `android.emu` with `ios.sim`.

## Project Structure

- `./bridge`: This contains the code to setup a websocket which allows communication between the test process and the LLM app. This allows us to:
  - create different conditions for testing the app by setting the user data.
  - perform mock device actions.
  - do quick navigations around the app (useful for setting up tests).

- `./models`: The models contain logic for interacting with elements on specific pages in the application. They roughly follow the Page Object Model that is standard in UI testing.

- `./setups`: This is the application data that will be used to start the session, it contains all the information regarding user settings, existing accounts, operations, balances, etc. It allows us to test different scenarios with independent configurations.

- `./specs`: The test suites themselves. We make use of the helpers and combine the snippets from the flows to build the different test scenarios. Ideally we should be able to reuse parts from flows in the specs.

- `./config.json`: Configuration for Detox.

- `./e2e-bridge-setup`: Used to start the websocket bridge on the client (app) side.

- `./environment.js`: Boilerplate code to setup Jest for the Detox tests.

- `./global-setup.js`: Run at the start of the test run to start the emulator and kick off the tests.

- `./global-teardown.js`: Run at the end of the test run to teardown the test and emulator prcoesses.

- `./helpers.js`: Convenience methods for use in the models/tests to make writing tests easier.

- `./setup.js`: Run after the global setup. It starts the websocket bridge, sets up the emulators to be more consistent in the test run (for example sets the time to 12.00), and shuts down the websocket bridge. Any logic to be run before and after a test run would go here.

### Other important files outside `/e2e`

- `apps/ledger-live-mobile/detox.config.js`: Contains the configurations for the emulators when running `detox test` and the build artifacts to be used when running `detox build`

- `.github/workflows/test-mobile.yml`: The workflow file to kick off tests in the Github servers.

## Environment Setup

Writing and running Detox tests requires Xcode for iOS and Android Studio (along with the SDK and emulator tools) for Android. Setting up your local environment for running the tests can be tricky, as there are two different platforms with their own intricacies as well as the working with React Native. The best place to setup both Android and iOS is to start with [React Native's own documentation](https://reactnative.dev/docs/environment-setup).

Detox also has good documentation for [Android](https://wix.github.io/Detox/docs/introduction/android-dev-env/) and [iOS](https://wix.github.io/Detox/docs/introduction/ios-dev-env) environment setup. Both guides differ slightly from the React Native ones but they may help to overcome some issues you have.

## Tools and Features

Coming soon...

### Trace Viewer

### Detox Recorder

### How to test with Android

To write new tests, you will need to have an emulator installed and have that match the Detox `avdName` (currently 'Nexus_6') in the `detox.config.js` file.

- [Create a virtual device](https://developer.android.com/studio/run/managing-avds). Be sure to make the device the correct architecture and system image.
- A running emulator specifically named `Nexus_6` that detox will look for upon launching. We could make this use the first device but as of now it's not dynamic.

### How to test with iOS

Coming soon.
