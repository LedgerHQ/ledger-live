# Lint

## Coin-family rules and baseline

`oxlint.config.mts` turns on the `coin-families/*` rules of `@support/lint` for the whole app (see the [support/lint README](../../../support/lint/README.md#coin-familiesno-coin-specific-import)). Violations that already existed are recorded in `oxlint-suppressions.json`, owned by `@ledgerhq/coin-integration`.

- Run `pnpm desktop lint:ci`: oxlint reads the baseline from the folder it runs in, so a run from another folder ignores it.
- Fixing a baselined leak makes the lint fail until the baseline is pruned: run `pnpm exec oxlint src static tools tests --prune-suppressions` from `apps/ledger-live-desktop`.
- A new leak fails the lint. Never silence it with an inline disable: `pnpm lint:coin-families-disables` rejects it.
- Test files (`*.test.*`, `__tests__`, `__integrations__`, `__mocks__`, `tests/`) are not checked.

## Exceptions

A baseline entry is debt unless it is listed in [`coin-families-exceptions.json`](../coin-families-exceptions.json), which gives the reason and the owner of each exception. See [the rule README](../../../support/lint/README.md#coin-families-exceptions). The Electron process plumbing of the Zcash native host (`src/main`, `src/preloader`, `src/renderer/zcash.ts`) stays for good, since it lives outside `src/renderer/families/`.
