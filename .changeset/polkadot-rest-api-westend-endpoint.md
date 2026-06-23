---
"@ledgerhq/coin-polkadot": patch
"@ledgerhq/live-common": patch
"@ledgerhq/live-env": patch
---

Migrate the Polkadot family (mainnet and Westend, relay chain and asset hub) to the new polkadot-rest-api endpoints, served under a `/v1` prefix (`/v1/rc` for the relay chain).

Adapt the coin-polkadot client to the rest-api, which is not fully 1:1 with substrate-api-sidecar:

- staking storage queries use `keys[]` only (drop the legacy `key1` query param, rejected by the rest-api);
- tolerate a missing `ss58Format` in `/runtime/spec` (e.g. Westend Asset Hub) instead of producing `NaN`;
- parse the new `/transaction/dry-run` response shape (`resultType` at the root, error under `result.error`, plus the `TransactionValidityError` case).
