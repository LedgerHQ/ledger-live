# wallet-api-feature-flag-module

`@ledgerhq/wallet-api-feature-flag-module` is a [Wallet API](https://github.com/LedgerHQ/wallet-api) `CustomModule` that lets Live Apps query Ledger Live's feature flags at runtime. A Live App can gate UI or behaviour on whether a specific flag is enabled in the host app, without needing its own flag infrastructure.

## What it does

- Extends `CustomModule` from `@ledgerhq/wallet-api-client` with a feature-flag RPC method
- Sends a `custom.featureFlags.get` request to the Ledger Live host
- Returns a typed map of flag IDs to their current `Feature` value (or `null` if not declared / unauthorized)
- Access is scoped: a Live App must declare the flags it needs in its manifest's `featureFlags` array

## Key exports / concepts

- `FeatureFlagModule` — the main class; instantiated with a `WalletAPIClient`
- `get(featureFlagIds: string[])` — fetch one or more flags; returns `Record<string, Feature<unknown> | null>`
- `Feature<T>` — flag shape (typically `{ enabled: boolean; params?: T }`)
- `FeatureFlagGetParams` / `FeatureFlagGetResult` — wire types for the RPC call

## Usage context

Used by Live Apps (dApps embedded in Ledger Live) that need to adapt their behaviour to feature flags controlled by the Ledger Live host. The host evaluates the flags via Firebase Remote Config; this module is the client-side API bundled with the Live App.
