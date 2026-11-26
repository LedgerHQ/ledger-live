# Lint

## Coin-family rules and baseline

`oxlint.config.mts` turns on the `coin-families/*` rules of `@support/lint` for the whole app (see the [support/lint README](../../../support/lint/README.md#coin-familiesno-coin-specific-import)). Violations that already existed are recorded in `oxlint-suppressions.json`, owned by `@ledgerhq/coin-integration`.

- Run `pnpm desktop lint:ci`: oxlint reads the baseline from the folder it runs in, so a run from another folder ignores it.
- Fixing a baselined leak makes the lint fail until the baseline is pruned: run `pnpm exec oxlint src static tools tests --prune-suppressions` from `apps/ledger-live-desktop`.
- A new leak fails the lint. Never silence it with an inline disable: `pnpm lint:coin-families-disables` rejects it.
- Test files (`*.test.*`, `__tests__`, `__integrations__`, `__mocks__`, `tests/`) are not checked.

## Accepted exceptions

These files are Electron process plumbing for the Zcash native host, not coin logic in generic UI. They live in `main`, `preloader` and the renderer root, outside `src/renderer/families/`, so the families contract cannot apply. They stay in the baseline for good.

| File | Why |
| --- | --- |
| `src/main/index.ts` | The main process starts and stops the `coin-zcash` utility process host (`setupZcashNativeHost`, `cleanupZcashNativeHost`). |
| `src/preloader/bridge/zcash.ts` | The preload only forwards the IPC channels listed in `ZCASH_IPC`, which comes from the `coin-zcash` contract. |
| `src/renderer/zcash.ts` | The renderer wraps the `coin-zcash` IPC client over the `zcash` bridge. |

`src/bridge/contract.ts` declares the `ZcashBridge` type for the same channel. No rule reports it, since it imports no coin package.

## Baselined, to burn down

These leaks are in the baseline until their owner fixes them. Fixing one means pruning the baseline (see above).

| File | Why | Owner |
| --- | --- | --- |
| `src/renderer/webworkers/workers/publicKeyTweakAdd.ts` | The worker imports `@ledgerhq/wallet-btc/crypto/secp256k1`. A family cannot expose its own web worker yet (see the TODO in the file), so it cannot move under `families/bitcoin/`. | `@ledgerhq/coin-integration` |
| `src/renderer/screens/settings/sections/Developer/DeviceIntentExecutorDevTool/intents/getEthAddressDMKSignerDemoIntent/job.ts` | Developer demo that builds a `SignerEthBuilder` from `@ledgerhq/device-signer-kit-ethereum`. | `@ledgerhq/live-devices` |

## Temporary exceptions

No rule reports these, so they are not in the baseline. They stay until the flags are removed.

| File | Why |
| --- | --- |
| `src/renderer/analytics/segment.ts` | The `ldmkSolanaSigner`, `ldmkCosmosSigner`, `ldmkPolkadotSigner` and `ldmkTronSigner` flags are sent as user properties. Their names are kept, and they go away with the flags. |
