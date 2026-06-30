# Ledger Wallet Mobile

Ledger Wallet Mobile (LWM) is the React Native app for Ledger hardware wallets on iOS and Android. Users can manage crypto assets, connect to devices over Bluetooth or USB, install apps on Ledger devices, update firmware, verify public addresses, and sign transactions.

- iOS: [App Store](https://apps.apple.com/fr/app/ledger-live-web3-wallet/id1361671700)
- Android: [Google Play](https://play.google.com/store/apps/details?id=com.ledger.live)

## Architecture

The app is built with React Native, React, Redux, and RxJS. It uses shared Ledger Wallet logic to communicate with devices, synchronize accounts, and prepare transactions.

### Code is shared with Desktop

| Package or directory               | Purpose                                 |
| ---------------------------------- | --------------------------------------- |
| `libs/**`                          | Legacy shared code                      |
| `domain`, `features`, and `shared` | New locations for shared business logic |

## Prerequisites

Run the repo root setup first:

```bash
mise install
pnpm i
```

Then install the native platform tooling you need:

| Platform | Requirements                                                                 |
| -------- | ---------------------------------------------------------------------------- |
| iOS      | Xcode, Ruby 3+, Bundler, CocoaPods                                           |
| Android  | Android Studio, JDK 17, Android SDK/NDK versions from `android/build.gradle` |

## Development

Start the bundler with one of these:

```bash
pnpm dev:llm:android    # bundle just for Android
pnpm dev:llm:ios        # bundle just for iOS
pnpm dev:llm            # one dev server for both
```

In a second terminal launch the native app(s):

```bash
pnpm mobile ios
pnpm mobile android
```

## Builds

For local builds:

```bash
pnpm build:llm:ios           # Build local iOS release
pnpm build:llm:android       # Build local Android release
```

For resetting data and updating native dependencies:

```bash
pnpm mobile pod              # iOS: run before first build and after changing native deps
pnpm mobile android:clean    # Android: clean storage like a fresh app install
```

## Testing

Within LWD, use the following commands for TDD and validatiion checks:

```bash
pnpm nx run live-mobile:lint            # lint (with "lint:fix" to fix)
pnpm nx run live-mobile:lint:i18n       # localization lint
pnpm nx run live-mobile:format:check    # code formatting (with "format" to format)
pnpm nx run live-mobile:typecheck       # typecheck
pnpm nx run live-mobile:test:jest       # unit tests
```

### E2E Testing

See [`e2e/mobile/README.md`](../../e2e/mobile/README.md) for End-to-End testing details.

## Environment variables

Environment variables are defined in `envDefinitions` within [libs/env/src/env.ts](../../libs/env/src/env.ts).

To force a particular value, passed it in from the CLI when starting the app,

e.g.

```bash
ANALYTICS_CONSOLE=TRUE pnpm dev:llm
```

## Translations and localisation

Translations are handled internally at Ledger. If a translation string is broken, report it to [Ledger support](https://support.ledger.com/) rather than editing localized content directly.

Use `pnpm mobile sync-locales` when adding a new supported language.
