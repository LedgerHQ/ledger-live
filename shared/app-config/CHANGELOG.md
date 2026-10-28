# @shared/app-config

## 0.2.0-next.0

### Minor Changes

- [#23614](https://github.com/LedgerHQ/ledger-live/pull/23614) [`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18) Thanks [@thesan](https://github.com/thesan)! - Add the App config devtool: it shows the default option of the build, then lists each app config switch with its options and their values, the option the session runs on and the one saved for the next. Selecting an option saves its id, and selecting the default removes it so the switch follows the default again; neither reloads. The Reload button (Restart on mobile) only appears while a saved option differs from the current one, and applies every saved change at once: a renderer reload on desktop, an app restart on mobile. A search bar and an All / Switched filter narrow the list. `resolveAppConfig` now returns `{ config, session }`: `session` is what it resolved the session from, which both stores pass to `createAppConfigMiddleware` with their reload. The middleware sets the new `appConfig` slice, saves the `selectAppConfigOption` and `resetAppConfigSwitch` actions to the storage and reloads on `reloadAppConfig`. `ConfigStorage` gains `remove`.

- [#23788](https://github.com/LedgerHQ/ledger-live/pull/23788) [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c) Thanks [@thesan](https://github.com/thesan)! - Add dev values to the app config on staging-default builds: each switch offers Dev | Staging | Prod and each fixed value Dev | Fixed in the App config devtool, which now also lists the fixed values. On Dev the values are text fields; a switch on Dev runs on its default option's values with its dev values on top, and a fixed value on its dev value. The schema of each value parses its dev value when the devtool saves it and again at boot, which ignores an invalid one. Dev values stay stored when another option is picked. Prod-default builds ignore Dev: they never offer it, never read the dev values, and ignore the selections holding `dev` without clearing them. The desktop build now defines `CONFIG_PROFILE` in every mode (`prod` outside development). `resolveAppConfig` now takes an `AppConfigStorage` (`selections` and `devValues`), `resetAppConfigSwitch` becomes `resetAppConfigSelection`, and `selectAppConfigOption` takes `{ id, selectionId }`. Playwright and Detox runs can pass dev values with `appConfigDevValues`.

## 0.1.0

### Minor Changes

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.

## 0.1.0-next.0

### Minor Changes

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.
