# Lint

## Coin-family rules and baseline

`oxlint.config.mts` turns on the `coin-families/*` rules of `@support/lint` for the whole app (see the [support/lint README](../../../support/lint/README.md#coin-familiesno-coin-specific-import)). Violations that already existed are recorded in `oxlint-suppressions.json`, owned by `@ledgerhq/coin-integration`. A new leak fails the lint and is never silenced with an inline disable.

- Run `pnpm mobile lint:ci`: oxlint reads the baseline from the folder it runs in.
- Fixing a baselined leak makes the lint fail until the baseline is pruned: run `pnpm exec oxlint src --prune-suppressions` from `apps/ledger-live-mobile`.

## Exceptions

A baseline entry is debt unless it is listed in [`coin-families-exceptions.json`](../coin-families-exceptions.json), which gives the reason and the owner of each exception. See [the rule README](../../../support/lint/README.md#coin-families-exceptions).
