---
"@ledgerhq/coin-vechain": major
"@ledgerhq/live-common": minor
---

**Breaking change**: the Thor endpoint is now supplied through the coin config as `node.url` instead of being resolved inside the module from `@ledgerhq/live-env`.

`coin-vechain` read its endpoint from `getEnv("API_VECHAIN_THOREST")` into a module-level constant. That made the package depend on `@ledgerhq/live-env`, which is a wallet-side concern and is unavailable in environments such as the standalone coin-service, and it froze the URL at import time, so a consumer had to set the environment before the module was ever loaded. The endpoint now travels on the currency config, as it already does in `coin-stellar` (`explorer.url`) and `coin-xrp` (`node.url`), and is read per call.

`@ledgerhq/live-env` has been dropped from the package dependencies entirely.

**What breaks**

- `VechainCurrencyConfig` gains a required `node: { url: string }`.
- `createBridges(signerContext, coinConfig)` no longer defaults its second argument; a config must be passed, so a missing endpoint fails loudly instead of silently pointing at mainnet.
- `VECHAIN_NODE_URL` is no longer exported from `src/constants`. Use `getNodeUrl()` from `src/config`.

**Migration**

```ts
// before — endpoint came from the environment
setEnv("API_VECHAIN_THOREST", "https://vechain.coin.ledger.com");
const { accountBridge } = createBridges(signerContext);

// after — endpoint is part of the config
const { accountBridge } = createBridges(signerContext, () => ({
  status: { type: "active" },
  node: { url: "https://vechain.coin.ledger.com" },
}));
```

Ledger Live consumers need no change: `families/vechain/config.ts` fills `node.url` from `getEnv("API_VECHAIN_THOREST")`, so that environment override keeps working at the wallet layer, where `live-env` belongs.
