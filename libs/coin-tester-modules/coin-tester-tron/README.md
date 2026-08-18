# @ledgerhq/coin-tester-tron

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Deterministic integration tester for `@ledgerhq/coin-tron`. Spins up a local
`tronbox/tre` node in Docker and runs scenarios through both the legacy bridge
(`@ledgerhq/coin-tron/bridge`) — the bridge that ships in production — and the
generic coin framework (`@ledgerhq/live-common/bridge/generic-coin-framework`).

## Run

```sh
pnpm coin:tester:tron start
```

Requires a running Docker daemon. Boot takes ~10 s; full suite ~45 s.

## Coverage

A single scenario runs twice — once per bridge strategy (`legacy` +
`generic-adapter`) via `describe.each`, each with its own fresh Docker boot
(`setup` spawns the container, `teardown` tears it down). Both strategies run
the **same** full transaction sequence below, in order:

| # | Transaction | Asserts |
| --- | --- | --- |
| 1 | Send 10 TRX | `fee == 0` (native send fits in the 5 000 B/day free bandwidth quota) |
| 2 | Send 100 LTT (TRC10) | `fee == 0` (TRC10 transfer is bandwidth, covered by the free quota) |
| 3 | Send max LTT (TRC10) | subAccount drained to 0 |
| 4 | Send 1 USDT (TRC20) | `fee > 0` (no frozen energy → TRX is burned for the TVM call). Uses a bit-for-bit copy of mainnet USDT (`TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`). |
| 5 | Send max USDT (TRC20) | subAccount drained to 0 |
| 6 | Send max TRX | parent spendableBalance drained near 0 (runs last because TRC20 transfers burn TRX) |

The `generic-adapter` strategy exercises the Tron family bridge API
(`getTokenFromAsset` / `getAssetFromToken` / `computeIntentType`) so TRC10/TRC20
sub-accounts are built and token transfers are crafted, signed, and broadcast
through the generic coin framework — same coverage as legacy.

## Layout

| File | Role |
| --- | --- |
| `src/tronbox.ts` | `docker compose` lifecycle + prefunded account discovery via the TRE admin API |
| `src/signer.ts` | Software secp256k1 signer implementing `TronSigner` from `@ledgerhq/coin-tron` |
| `src/helpers.ts` | `getBridges(strategy, signer)` — legacy bridge wrapped in a `GenericTransaction` adapter, or the generic coin framework bridge for the `tron` family |
| `src/indexer.ts` | MSW server intercepting `GET /v1/accounts/:addr{,/transactions,/transactions/trc20}` and re-formatting local-node data as TronGrid v1 responses |
| `src/tokenFixtures.ts` | `issueTrc10`, `deployTrc20` |
| `src/fixtures/usdt-trc20.json` | Frozen mainnet bytecode of the canonical USDT contract (refresh command in the file's source comment) |
| `src/scenarii/tron.ts` | Single dual-strategy scenario (TRX + TRC10 + TRC20 for both strategies) |

## Limitations

Staking flows (freeze/unfreeze v2, vote, claim, withdrawExpireUnfreeze) are not
exercised. The native Live screens for them are dormant; production uses the
StakeKit Live App for those paths. Covering them deterministically would
require a custom `java-tron` image with `UnfreezeDelayDays=0` at genesis (or
freeze-setup primitives in the tester).
