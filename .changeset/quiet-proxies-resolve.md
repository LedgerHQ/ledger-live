---
"@ledgerhq/coin-concordium": major
"@ledgerhq/live-common": minor
"@ledgerhq/types-live": minor
"@ledgerhq/ledger-wallet-framework": minor
---

Make coin-concordium stateless: `createBridges` takes a `Context`, and the proxy tuning, fee fallbacks, cache TTLs and WalletConnect relay come from `config_currency_concordium*`. `assignFromAccountRaw` may return a promise, which deserialization awaits.
