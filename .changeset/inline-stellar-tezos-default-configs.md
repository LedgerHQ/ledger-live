---
"@ledgerhq/live-common": patch
---

Inline the Stellar and Tezos default configs instead of reading them with `getEnv`, remove the matching env variables (`API_STELLAR_HORIZON`, `API_STELLAR_HORIZON_FETCH_LIMIT`, `API_STELLAR_HORIZON_STATIC_FEE`, `API_TEZOS_BAKER`, `API_TEZOS_TZKT_API`, `API_TEZOS_NODE`, `TEZOS_MAX_TX_QUERIES`) and force static Stellar fees in the `ledger-live-common` jest setup instead of the CI env files
