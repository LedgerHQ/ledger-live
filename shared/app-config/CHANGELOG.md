# @shared/app-config

## 0.1.0

### Minor Changes

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.

## 0.1.0-next.0

### Minor Changes

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.
