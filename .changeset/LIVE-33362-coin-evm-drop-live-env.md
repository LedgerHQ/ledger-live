---
"@ledgerhq/coin-evm": minor
"@ledgerhq/live-common": minor
---

Remove `@ledgerhq/live-env` from coin-evm (LIVE-33362). The Ledger explorer base URL, the client-version header, the EIP-1559 base-fee multiplier and the legacy-transaction switch now arrive as `EvmConfig` fields (`ledgerExplorerUri`, `ledgerClientVersion`, `eip1559BaseFeeMultiplier`, `forceLegacyTransactions`), each falling back to the value the env used to default to, so the module runs in environments that have no live-env at all. `families/evm/config.ts` supplies the three Ledger-backend settings from the env keys, as `families/tezos/config.ts` already does, so the existing overrides keep working — including the EIP-1559 multiplier exposed in both apps' experimental settings — with per-currency and remote values taking precedence for when the backend serves them (LIVE-22454). They go only to the 8 currencies wired to Ledger's node/explorer/gasTracker, the only ones that can read them, and through a `default` getter rather than a static object, because `LEDGER_CLIENT_VERSION` is set during app boot and the multiplier is edited at runtime, both after that module is imported.

`forceLegacyTransactions` comes from `EVM_FORCE_LEGACY_TRANSACTIONS` on every currency instead, since the RPC fee path reads it too and not only the Ledger one.

`X-Ledger-Client-Version` keeps being sent explicitly rather than leaning on the `axios.defaults` header live-network installs: the two files concerned call axios directly, so that default only reaches them if some other module happened to import `live-network/network` first — which does not hold for a consumer embedding coin-evm on its own, and some Ledger backends allowlist on that header.
