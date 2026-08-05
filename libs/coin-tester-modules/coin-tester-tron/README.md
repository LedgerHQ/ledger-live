# @ledgerhq/coin-tester-tron

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Deterministic integration tester for `@ledgerhq/coin-tron`. Spins up a local
`tronbox/tre` node in Docker and runs one scenario through the generic coin
framework (`@ledgerhq/live-common/bridge/generic-coin-framework`) — the bridge
that ships in production. Tron has no bespoke bridge any more (LIVE-34994), so
there is no second strategy to select.

## Run

```sh
pnpm coin:tester:tron start
```

Requires a running Docker daemon. Boot takes ~10 s; full suite ~45 s.

## Coverage

A single scenario runs once, with its own Docker boot (`setup` spawns the
container, `teardown` tears it down), over the transaction sequence below, in
order:

| # | Transaction | Asserts |
| --- | --- | --- |
| 1 | Send 10 TRX | `fee == 0` (native send fits in the 5 000 B/day free bandwidth quota) |
| 2 | Send 100 LTT (TRC10) | `fee == 0` (TRC10 transfer is bandwidth, covered by the free quota) |
| 3 | Send max LTT (TRC10) | subAccount drained to 0 |
| 4 | Send 1 USDT (TRC20) | `fee > 0` (no frozen energy → TRX is burned for the TVM call). Uses a bit-for-bit copy of mainnet USDT (`TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`). |
| 5 | Send max USDT (TRC20) | subAccount drained to 0 |
| 6 | Send max TRX | parent spendableBalance drained near 0 (runs last because TRC20 transfers burn TRX) |

The run exercises the Tron family bridge API (`getTokenFromAsset` /
`getAssetFromToken` / `computeIntentType`) so TRC10/TRC20 sub-accounts are built
and token transfers are crafted, signed, and broadcast through the generic coin
framework.

## Layout

| File | Role |
| --- | --- |
| `src/tronbox.ts` | `docker compose` lifecycle + prefunded account discovery via the TRE admin API |
| `src/signer.ts` | Software secp256k1 signer implementing `TronSigner` from `@ledgerhq/coin-tron` |
| `src/helpers.ts` | `getBridges(signer)` — the generic coin framework bridges for the `tron` family, with the device-facing `TronSigner` adapted to the framework's `signTransaction(path, rawTxHex, options)` contract |
| `src/indexer.ts` | MSW server intercepting `GET /v1/accounts/:addr{,/transactions,/transactions/trc20}` and re-formatting local-node data as TronGrid v1 responses |
| `src/tokenFixtures.ts` | `issueTrc10`, `deployTrc20` |
| `src/fixtures/usdt-trc20.json` | Frozen mainnet bytecode of the canonical USDT contract (refresh command in the file's source comment) |
| `src/scenarii/tron.ts` | The scenario (TRX + TRC10 + TRC20) |

## Limitations

Staking flows (freeze/unfreeze v2, vote, claim, withdrawExpireUnfreeze) are not
exercised here. The native Live screens for them are dormant; production uses
the StakeKit Live App for those paths. Covering them deterministically would
require a custom `java-tron` image with `UnfreezeDelayDays=0` at genesis (or
freeze-setup primitives in the tester). The mapping those modes rely on —
`familySpecificData` → `buildIntentData` → `TronTxData` — is covered by unit
tests in `ledger-live-common` (`families/tron/bridge/api.test.ts`) instead.

Clear-signing is likewise out of reach: the software signer has no device, so
the TRC-10 CAL-signature branch of the shipping signer
(`ledger-live-common/src/families/tron/signer.ts`) is never taken here.
