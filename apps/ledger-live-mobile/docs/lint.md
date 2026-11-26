# Lint

## Coin-family rules and baseline

`oxlint.config.mts` turns on the `coin-families/*` rules of `@support/lint` for the whole app (see the [support/lint README](../../../support/lint/README.md#coin-familiesno-coin-specific-import)). Violations that already existed are recorded in `oxlint-suppressions.json`, owned by `@ledgerhq/coin-integration`. A new leak fails the lint and is never silenced with an inline disable.

## Accepted exceptions

No rule reports these, so they are not in the baseline.

| File | Why |
| --- | --- |
| `src/analytics/segment.ts` | The `ldmkSolanaSigner`, `ldmkCosmosSigner`, `ldmkPolkadotSigner` and `ldmkTronSigner` flags are sent as user properties. Their names are kept, and they go away with the flags. |
| `src/utils/constants.ts` | `EXCLUDED_LOGS_ERROR_NAME` lists coin error names (tron, solana, evm, vechain, hedera) as strings, so Datadog filtering needs no coin import. |
