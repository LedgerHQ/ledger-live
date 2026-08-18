# @ledgerhq/wallet-framework-test-setup

> [!CAUTION]
> **Status: UNSTABLE** — Tied to `@ledgerhq/ledger-wallet-framework` which is actively being developed.

Jest bootstrap for `@ledgerhq/ledger-wallet-framework`. Wires both framework ports for tests:

- **`CurrenciesResolver`** — real domain currencies from `@domain/entity-currency-crypto`
- **`FrameworkCryptoAssetsStore`** — forwarding proxy so `setupMockCryptoAssetsStore()` overrides in individual tests propagate automatically through the framework port

## Usage

```js
// jest.config.js
setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"]
```

```json
// package.json
"devDependencies": {
  "@ledgerhq/wallet-framework-test-setup": "workspace:^"
}
```
