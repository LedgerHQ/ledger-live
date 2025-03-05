**[We are hiring, join us! 👨‍💻👩‍💻](https://jobs.lever.co/ledger/?department=Tech)**

# Monorepo App Structure

1. [Ledger Live Desktop](https://github.com/LedgerHQ/ledger-live/tree/develop/apps/ledger-live-desktop)
2. Ledger Live Mobile (<- you are here)
   1. Backed by a shared library from the root `lib` folder: [ledger-live-common](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledger-live-common)

## Adding a blockchain support into Ledger Live?

This is the folder gathering every blockchain's mobile application implementation.

To get up to speed we advise you to:

- read our documentation available on our [Developer Portal](https://developers.ledger.com/docs/coin/general-process/)
- and visit our [Discord](https://developers.ledger.com/discord-pro/) server to chat with developer support and connect with the developer community.

# ledger-live-mobile

> [!IMPORTANT]
> Ledger Live is a mobile companion app for Ledger hardware wallets.
>
> It allows users to manage their crypto assets securely, such as `Bitcoin`, `Ethereum`, `XRP` and many others.
>
> Ledger Live mobile is available for [iOS](https://itunes.apple.com/fr/app/id1361671700) and [Android](https://play.google.com/store/apps/details?id=com.ledger.live).

![](https://user-images.githubusercontent.com/211411/51758554-42edb980-20c6-11e9-89f0-308949a760d6.png)

## Tech Stack & Capabilities

Ledger Live mobile is a **native mobile application** built using `React Native`, `React`, `Redux`, `RxJS`.

It is compatible with iOS and Android. It communicates with [Ledger hardware wallet devices](https://shop.ledger.com/pages/hardware-wallets-comparison) via Bluetooth (when compatible) or USB to:

- manage installed applications
- update the device firmware
- verify public addresses and sign transactions with [ledgerjs](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs).

We also share core business logic with Ledger Live Desktop through the [@ledgerhq/live-common library](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledger-live-common) package.

---

# 🛠️ Developing on ledger-live-mobile

## 🔗 Dependencies & Pre-requisites

<details>
  <summary>[For External Contributors] Installing pre-requisities</summary>

- Node LTS version
- Pnpm
- [React Native (without Expo)](https://reactnative.dev/docs/environment-setup)

###  iOS

- XCode (our CI builds run 15.3, so 15.3 is recommended)
- Ruby 3.3.0 or above. The macOS built-in Ruby [does not work properly for installing dependencies of the iOS app](https://jeffreymorgan.io/articles/ruby-on-macos-with-rvm/), you have to install Ruby with for instance [Homebrew](https://brew.sh/) or [rvm](https://rvm.io/rvm/install) and make sure that `which ruby` points to that newly installed Ruby.

### Android

- Android Studio
- JDK 17
- Required SDK tools: (go to Android Studio > Tools > SDK Manager > SDK Tools > check "Show Package Details" at the bottom right)
  - Android NDK 21.4.7075529 (in case this doc is outdated, check the version specified as `ndkVersion` in `android/build.gradle`)
  - CMake 3.10.2

</details>

<details>
  <summary>[For Ledger Employees] Installing pre-requisities</summary>

  **If you are a Ledger employee** please follow this [wiki step-by-step tutorial](https://ledgerhq.atlassian.net/wiki/x/HQCvQQE).

</details>

## 🔊 Commands

> [!IMPORTANT]
> Reminder: Every command should be run at the monorepository's root folder

### Install dependencies packages

`pnpm i`

### 👷 Development mode

`pnpm dev:llm`

```shell
  $> pnpm dev:llm -- --reset-cache
```

> [!TIP]
> Sometimes you may need to reset or clear the React Native packager's cache.
> 
> To do so, you can pass the `--reset-cache` flag to the start script:

### 👀 Watch deps

| Description                       | Command                                                                    |
| --------------------------------- | -------------------------------------------------------------------------- |
| #**Development Section**    |                                                                            |
| Base                              | `$> pnpm dev:llm`                                                        |
| Watch commons                     | `$> pnpm watch:common`                                                   |
| Watch Ledger JS                   | `$> pnpm watch:ljs`                                                      |
| Watch Coin Integration            | `$> pnpm watch:coin`                                                     |
| Watch specific Lib                | `$> pnpm turbo run watch --filter="./libs/ledgerjs/packages/hw-app-btc"` |
| Watch a specific Coin Integration | `$> pnpm turbo run watch --filter="./libs/coin-modules/coin-bitcoin"`    |

> [!TIP]
> In another terminal and in parallel to `pnpm dev:llm`, you can watch different libs from the monorepo

### 🏭 Production mode

| Description                        | Command                       | Note                                                                                                                                                                                              |
| ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run iOS App in production mode    | `$> pnpm mobile ios`        | or `open ios/ledgerlivemobile.xcworkspace` in XCode                                                                                                                                             |
| Run Android App in production mode | `$> pnpm mobile android`    | or open `android/` in Android Studio                                                                                                                                                            |
| Build & Sign iOS App               | `$> pnpm build:llm:ios`     | Produces a development .ipa signed with the developer's current certificates<br />(can be installed on phones added to our apple dev center).<br />Not eligible for **AppStore/TestFlight** |
| Build & Sign Android App           | `$> pnpm build:llm:android` | Produces a development .apk that can be installed on Android phones.<br />**Not eligible for Google PlayStore**                                                                             |

> [!TIP]
> You need to have metro running with `pnpm dev:llm` then `pnpm mobile ios` in another terminal

### 🧪 Unit Testing

| Desctiption            | Command                 | col3                                                                               |
| ---------------------- | ----------------------- | :--------------------------------------------------------------------------------- |
| Run unit tests         | `$> pnpm mobile test` |                                                                                    |
| Run Android unit tests | `$> pnpm mobile test` | Deletes Ledger Live Mobile data, equivalent to doing it manually through settings. |

### End to End testing

Refer to the e2e specific [wiki](https://github.com/LedgerHQ/ledger-live/wiki/LLM:End-to-end-testing).

## Environment Variables

Optional environment variables you can put in `.env`, `.env.production` or `.env.staging` for debug, release, or staging release builds respectively.

[A more exhaustive list of documented environment variables can be found here](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/env/src/env.ts).

| Environment variablae                      | Default Value (if any)    | Description                                                                                                                                                                |
| ------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEVICE_PROXY_URL=http://localhost:8435` | `http://localhost:8435` | Use the ledger device over HTTP.<br />Useful for debugging on an emulator.<br />More info about this in the section[Connection via HTTP bridge](#connection-via-http-bridge). |
| `BRIDGESTREAM_DATA`                      |                           | Comes from the QRcode export desktop app console.log.<br />Allows to bypass the bridgestream scanning.                                                                  |
| `DEBUG_RNDEBUGGER`                       | 1                         | Enables react native debugger.                                                                                                                                             |
| `DISABLE_READ_ONLY`                      | 1                         | Disables readonly mode by default.                                                                                                                                         |
| `SKIP_ONBOARDING`                        | 1                         | Skips the onboarding flow.                                                                                                                                                 |

## 🗺️ Paths resolution mapping

Add any desired path mapping in `tsconfig.json`: (for instance `"@utils/*": ["./src/utils/*"]`)
Then, import `@utils/constants` in your project files and it will automatically resolve to `./src/utils/constants.{js/jsx/ts/tsx}`.

Please respect the following structure: `"@{package}/*": ["{any/path}/*"]`

```
// tsconfig.json
 {
    { ... }
    "paths": {
      "@utils/*": ["./src/utils/*"],
      "@constants/*": ["./src/constants/*"],
    }
  }
```

# 🧹 Maintenance

## 💬 Refresh languages translations (when we add new languages)

```
$> pnpm mobile sync-locales
```

## Debugging & Connectivity

<details>
  <summary>Troubleshooting tips</summary>

### 🐬 Flipper

[Flipper](https://fbflipper.com/) has been integrated in the project, so you can use it to get debugging information (like network monitoring) and find other useful data you could previously get from scattered places, here neatly presented in a single interface (like logs and crash reports for both platforms).

React Native integration seems pretty bleeding edge right now, so don't expect everything to work just yet.

- Install [Flipper](https://fbflipper.com/) on your computer
- Launch it 🚀
- Run Ledger Live Mobile in debug as usual (set `DEBUG_RNDEBUGGER=1` in your `.env`)
- No need to enable remote debug!

List of Flipper's plugins that will help you to debug efficiently the application:

- Hermes Debugger (RN)
- Logs
- React DevTools
- Redux Debugger

### Native code

#### XCode / Android studio

Run the app from the Apple or Google own IDE to get some native debugging features like breakpoints etc.

#### 🔌 Connection to iOS or Android emulators via HTTP bridge

It is possible to run Ledger Live Mobile on an emulator and connect to a Nano that is plugged in via USB.

- Install the [ledger-live cli](https://developers.ledger.com/docs/coin/ledger-live-cli/).
- Plug in your Nano to your computer.
- Run `ledger-live proxy` or `pnpm run:cli proxy`. A server starts and displays variable environments that can be used to build Ledger-Live Mobile. For example:
  
  ```shell
    DEVICE_PROXY_URL=ws://localhost:8435
    DEVICE_PROXY_URL=ws://192.168.1.14:8435
    Nano S proxy started on 192.168.1.14
  ```

- Either
  - First, do `export DEVICE_PROXY_URL=the_adress_given_by_the_server` or paste this variable environment in the `.env` file at the root of the project (create it if it doesn't exist)
  - Then, build & run Ledger Live Mobile `pnpm mobile ios` or `pnpm mobile android`
  - OR
  - First, build & run Ledger Live Mobile `pnpm mobile ios` or `pnpm mobile android`
  - Then, go to the settings tab, then _debug_ > _connectivity_ > _http transport_ and paste the IP (ex: 192.168.1.14)
- When prompted to choose a Nano device in Ledger Live Mobile, you will see your Nano available with the adress from above, just select it and it should work normally.

</details>

## 📄 Extra Docs

- [Deep Linking 🔗](https://github.com/LedgerHQ/ledger-live/wiki/LLM:DeepLinking)
- [UI Theming 🎨](https://github.com/LedgerHQ/ledger-live/wiki/LLM:Theming)

