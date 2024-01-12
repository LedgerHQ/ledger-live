# Ledger Live Mobile end-to-end testing

This project uses [Detox](https://github.com/wix/Detox) and [Jest](https://jestjs.io/) for end-to-end testing the LLM application. Detox is a mobile end-to-end testing tool developed by Wix, and is specifically built for React Native applications. Please refer to the documentation of those projects for the specifics. In this readme you will find the key setup and workflow steps for testing a flow in Ledger Live Mobile.

---

---

## Quick start script to install iOS and Android debug versions from scratch

> Ensure you have Android Studio and Xcode installed with the relevant development/emulator tools installed (see 'Local Environment Setup' below).

The following script will ensure a clean local environment for running detox tests in debug mode.

```bash
pnpm clean
pnpm i --filter="live-mobile..." --filter="ledger-live" --no-frozen-lockfile --unsafe-perm
pnpm mobile pod
pnpm build:llm:deps
pnpm mobile exec detox clean-framework-cache && pnpm mobile exec detox build-framework-cache
pnpm mobile e2e:build -c android.emu.debug
pnpm mobile e2e:build -c ios.sim.debug
```

---

---

## Local Environment Setup

Writing and running Detox tests requires Xcode for iOS and Android Studio (along with the SDK and emulator tools) for Android. The best place to setup both Android and iOS is to follow the [React Native's own documentation](https://reactnative.dev/docs/environment-setup).

Next, follow the steps in the Detox [Environment Setup](https://wix.github.io/Detox/docs/introduction/getting-started) section.

Prerequisites for all Detox tests:

- Node is installed (currently we use v16)

### Tips for iOS setup

Most of the setup is taken care of in the React Native docs, but you will have to do some additional installations, such as the Detox CLI and `applesimutils` (MacOS only). After following the above React Native and Detox steps, you should have the following setup:

- XCode and XCode command line tools - run `xcode-select -v` and `xcrun --version` to make sure these are working
- `rbenv` is installed and `which ruby` points to an `rbenv` shim, not `usr/bin/ruby`. Be sure to follow the steps to add `rbenv` to your shell profile.
- An iPhone simulator for iPhone 13 - open Xcode > Window > Devices and Simulators > Simulators > Add a new device from the '+' sign in the bottom right corner.
- `applesimutils` is installed via npm.

### Tips for Android setup

The Android toolkit can be more complex than the iOS one. Once you've done the React Native and Detox setup steps, follow the Detox [Android Environment Setup guide](https://wix.github.io/Detox/docs/guide/android-dev-env) for further steps. The main things to make sure of are:

- Java version 11 installed. Check with `java -version`
- Android 12.0 (API Level 11) is installed.
- Android SDK Build Tools, SDK Platform Tools, SDK Command Line Tools, Android Emulator, CMake 3.10.2 and NDK 21.4.7075529 are installed. You can do this through Android Studio > Tools > SDK Tools, or via the [command line](https://wix.github.io/Detox/docs/guide/android-dev-env#heres-how-to-install-them-using-the-command-line).
- Your shell profile (for example `~/.zshrc`) should have environmental variables setup something like this:

```shell
export JAVA_HOME=`/usr/libexec/java_home`
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools/bin/sdkmanager:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
```

> Note: There is a bit of inconsistency in the documentation between React Native, Detox and Android themselves about whether to use `ANDROID_ROOT` or `ANDROID_SDK_ROOT`. The second one is now deprecated but both should work in either case.

---

---

## Test Setup and Execution

Clean your local environment to remove `node_modules` and previous iOS and Android mobile app builds:

```bash
pnpm clean
```

Install dependencies:

```bash
pnpm i
```

> There is a filtered version of this command which should be quicker and includes only dependencies needed for LLM: `pnpm i --filter="live-mobile..." --filter="ledger-live"`.

Build dependencies for the mobile app:

```bash
pnpm build:llm:deps
```

### Android Tests

Verify you have an emulator [installed](https://developer.android.com/studio/run/managing-avds) and have that match the Detox `avdName` (currently 'Pixel_5_API_31') in the `detox.config.js` file. Be sure to make the device the correct architecture and system image. Currently this is x86_64 if you are on an Intel mac and arm64_v8a if you are on an M1 Mac (\_info required for Windows and Linux\*). If you are on an Intel Mac, you must run `export CI=1` in the terminal session before

- Build the apps
  - Debug: `pnpm mobile e2e:build -c android.emu.debug`
  - Release: `pnpm mobile e2e:build -c android.emu.release`
- Run the tests
  - Debug: First, run `pnpm mobile start` to run Metro bundler, then in a separate terminal window run `pnpm mobile e2e:test -c android.emu.debug`. When developing locally, you may need to put the content of the .env.mock file in the app .env file to have the right test environment.
  - Release: `pnpm mobile e2e:test -c android.emu.release`

> If you get an error for Android debug tests complaining that the emulator cannot find the bundled JS script, run `adb reverse tcp:8081 tcp:8081` before starting the tests (but make sure the emulator is already started). This makes it possible for the emulator to access the Metro bundler on your local machine.

### iOS Tests

Make sure you have the correct iPhone simulator that is listed in `detox.config.js` installed (currently 'iPhone 13'). You can check if you do with `applesimutils --list`. Also make sure you have an iOS version installed for simulators by going to Xcode > Preferences > Components. You can try whichever version you like, but iOS 13.0 is known to work locally.

- Build the apps
  - Debug: `pnpm mobile e2e:build -c ios.sim.debug`
  - Release: `pnpm mobile e2e:build -c ios.sim.release`
- Run the tests
  - Debug: First, run `pnpm mobile start` to run Metro bundler, then in a separate terminal window run `pnpm mobile e2e:test -c ios.sim.debug`
  - Release: `pnpm mobile e2e:test -c ios.sim.release`

---

---

## Project Structure

Most files for the tests are in the `/e2e` LLM app folder.

- `/bridge`: This contains the code to setup a websocket which allows communication between the test process and the LLM app. This allows us to:

  - create different conditions for testing the app by setting the user data.
  - perform mock device actions.
  - do quick navigations around the app (useful for setting up tests).

- `/models`: The models contain logic for interacting with elements on specific pages in the application. They roughly follow the Page Object Model that is standard in UI testing.

- `/setups`: This is the application data that will be used to start the session, it contains all the information regarding user settings, existing accounts, operations, balances, etc. It allows us to test different scenarios with independent configurations.

- `/specs`: The test suites themselves. We make use of the helpers and combine the snippets from the flows to build the different test scenarios. Ideally we should be able to reuse parts from flows in the specs.

- `/jest.config.js`: Configuration for Detox. Contains settings like what the setup and teardown files are, how long the timeout is, what test runner to use, etc.

- `/helpers.ts`: Convenience methods for use in the models/tests to make writing tests easier.

- `/setup.ts`: Run after the global setup. It starts the websocket bridge, sets up the emulators to be more consistent in the test run (for example sets the time to 12.00), and shuts down the websocket bridge. Any logic to be run before and after a test run would go here.

### Other important files outside `/e2e`

- `apps/ledger-live-mobile/detox.config.js`: Contains the configurations for the emulators when running `detox test` and the build artifacts to be used when running `detox build`

- `.github/workflows/test-mobile.yml`: The workflow file to kick off tests in the Github servers.

---

---

## Development workflow

The workflow for adding new tests is similar to the [desktop](https://github.com/LedgerHQ/ledger-live/wiki/LLD:Testing#development) workflow. These are:

### Step 1: Identify Elements

Detox has a [simpler API](https://wix.github.io/Detox/docs/api/matchers) than Playwright and other E2E test solutions like Appium and Webdriver. The easiest way to make elements usable by Detox is by adding a `testId` attribute to the element in the code. Make sure to put the `testId` at the lowest level possible in the DOM tree.

Ideally these are placed at development time so tests are easier to write in future.

For example:

```js
<QueuedDrawer
  testId="AddAccountsModal"
  isOpen={isOpened}
  onClose={onClose}
  title={t("portfolio.emptyState.addAccounts.addAccounts")}
>
```

### Step 2: Create a page object

Page objects are methods that group together behaviours so that tests are more readable and correspond to actions users would take in the app.

To create them:

- Use the existing helper methods in `apps/ledger-live-mobile/e2e/models/helpers.js` for actions such as clicking, entering text...
- Create a new `.ts` step file in the `apps/ledger-live-mobile/e2e/models` directory. Make sure it is named logically.
- Start creating methods using the following pattern:

```js
import { getElementByText, tapByElement, /* ... */ } from "path/to/helpers";

class MyPageObjectModel {
  getSomeItemByText = () => getElementByText("Set up my Ledger");
  getSomeItemById = () => getElementById("continue");
}

async chooseToSetupLedger() {
  await tapByElement(this.getSomeItemByText());
  await tapByElement(this.getSomeItemById());
}
```

### Step 3: Create a test file

Test files go in the `apps/ledger-live-mobile/e2e/specs` directory. Import the relevant page object model files and follow the example to create new tests:

```js
import { expect, waitFor /* ... */ } from "detox";
import OnboardingSteps from "../models/onboarding/onboardingSteps";
import PortfolioPage from "../models/portfolioPage";

let onboardingSteps: OnboardingSteps;
let portfolioPage: PortfolioPage;
describe("Onboarding", () => {
  beforeAll(async () => {
    // Load some configs and setup your pages here
    await loadConfig("1AccountBTC1AccountETH", true);
    onboardingSteps = new OnboardingSteps();
    onboardingSteps = new PortfolioPage();
  })

  it("onboarding step should be visible", async () => {
     // test assertions
    await expect(onboardingSteps.getSomeElement()).toBeVisible();
  });

  it("should be able to start onboarding", async () => {
    // test actions (tap on some element)
    await onboardingSteps.startOnboarding();
  });

  it("should do some other stuffs", async () => {
    await onboardingSteps.DoIOwnDevice(true);
    // ...
  })

```

---

---

## Tools and Features

Coming soon... :construction:

### Trace Viewer

### Detox Recorder

---

---

## CI

> :warning: Android and iOS tests are currently switched **off** on the CI for PRs due to issues installing the app on the emulators and general flakiness with the runners. However the tests are running at [midday and midnight daily](https://github.com/LedgerHQ/ledger-live/actions/workflows/test-mobile-e2e.yml)

## Tips

### Animations

Detox synchronization sometime can't handle well animations, especially looping ones.
You could disable either the blocking animation while you are in MOCK env (preferred) or disable the synchronization by wrapping your test code between these lines :

```js
await device.disableSynchronization();
...
await device.enableSynchronization();
```

https://wix.github.io/Detox/docs/api/device#devicedisablesynchronization

You will have to wait manually (waitFor) to replace the synchronization. But be really careful about it, as it might make these tests unstable.
