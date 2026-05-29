# Ledger Live Mobile

Ledger Live Mobile is the React Native app for Ledger hardware wallets on iOS
and Android. Users can manage crypto assets, connect to devices over Bluetooth
or USB, update firmware, verify public addresses, and sign transactions.

- Related app: [Ledger Live Desktop](../ledger-live-desktop/README.md)
- Shared business logic: [ledger-live-common](../../libs/ledger-live-common/README.md)
- iOS: [App Store](https://apps.apple.com/fr/app/ledger-live-web3-wallet/id1361671700)
- Android: [Google Play](https://play.google.com/store/apps/details?id=com.ledger.live)

## Architecture

The app is built with React Native, React, Redux, and RxJS. It uses LedgerJS and
shared Ledger Wallet logic to communicate with devices, synchronize accounts,
and prepare transactions. Core wallet behavior is shared with Desktop through
`@ledgerhq/live-common`.

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

React Native environment guidance lives in the
[React Native docs](https://reactnative.dev/docs/environment-setup) for the
"without Expo" flow.

## Development

Run commands from the repository root.

```bash
pnpm dev:llm
pnpm dev:llm:ios
pnpm dev:llm:android
pnpm mobile ios
pnpm mobile android
```

Use `pnpm dev:llm -- --reset-cache` when Metro cache state causes stale bundles.

For native builds:

```bash
pnpm build:llm:ios
pnpm build:llm:android
pnpm mobile pod
pnpm mobile android:clean
```

For checks:

```bash
pnpm mobile lint
pnpm mobile lint:i18n
pnpm mobile format:check
pnpm mobile typecheck
pnpm mobile test:jest
```

See the repo-level [common commands](../../docs/common-commands.md) and
[validation guidance](../../docs/validate-before-finishing.md) for maintained
command coverage.

## Watching Dependencies

In another terminal, run the relevant watcher when changing shared packages used
by Mobile:

```bash
pnpm watch:common
pnpm watch:ljs
pnpm watch:coin
pnpm turbo run watch --filter="./libs/ledgerjs/packages/hw-app-btc"
pnpm turbo run watch --filter="./libs/coin-modules/coin-bitcoin"
```

## Environment

Optional variables can go in `.env`, `.env.production`, or `.env.staging`:

```bash
DEVICE_PROXY_URL=http://localhost:8435
BRIDGESTREAM_DATA=...
DEBUG_RNDEBUGGER=1
DISABLE_READ_ONLY=1
SKIP_ONBOARDING=1
```

Other environment variables are defined in
[libs/env/src/env.ts](../../libs/env/src/env.ts).

## E2E Testing

Use [../../e2e/mobile/README.md](../../e2e/mobile/README.md) for the maintained
Detox and Speculos setup, build, and run commands.

To connect an emulator to a Ledger device over USB, run the CLI proxy:

```bash
pnpm run:cli proxy
```

Then use the printed `DEVICE_PROXY_URL` in `.env` or in the app debug settings
under connectivity HTTP transport.

## Local Notes

Path aliases belong in `tsconfig.json` using the `@name/*` pattern:

```json
{
  "paths": {
    "@utils/*": ["./src/utils/*"],
    "@constants/*": ["./src/constants/*"]
  }
}
```

Use `pnpm mobile sync-locales` when adding a new supported language.

For blockchain integration guidance, use the
[Ledger Developer Portal](https://developers.ledger.com/docs/coin/general-process/).
