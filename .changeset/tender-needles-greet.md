---
"@ledgerhq/coin-stellar": minor
---

Fix: stellar `Horizon.AxiosClient` interceptors in `coin-stellar/src/network/horizon.ts` resilient to `coinConfig` not being initialised yet.
