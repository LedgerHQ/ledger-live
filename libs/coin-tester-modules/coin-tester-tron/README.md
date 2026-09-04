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
| 6 | Send 5 TRX with a memo | the memo survives the round-trip — it is crafted into `raw_data.data`, broadcast, and decoded back onto `extra.memo` (LIVE-35735). `fee == 0` here because the devnet does not charge TIP-387's `memoFee` (`getMemoFee` is 0 on `tronbox/tre`) and the memo still fits the free bandwidth quota |
| 7 | Send 1 USDT with a custom fee limit | `0 < fee <= CUSTOM_FEE_LIMIT_SUN`, subAccount balance delta matches |
| 8 | Freeze 50 TRX for BANDWIDTH | `tronResources.frozen.bandwidth` grows by exactly the frozen amount; op type `FREEZE`, no native value |
| 9 | Vote 1 for the devnet witness | `tronResources.votes` contains the witness; op type `VOTE` |
| 10 | Unfreeze 50 TRX of BANDWIDTH | a pending `unFrozen.bandwidth` entry appears; op type `UNFREEZE` |
| 11 | Undelegate 100 TRX of BANDWIDTH | `delegatedFrozen.bandwidth` shrinks; op type `UNDELEGATE_RESOURCE` |
| 12 | Send max TRX | parent spendableBalance drained near 0 (runs last because TRC20 transfers burn TRX) |

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
| `src/stakingFixtures.ts` | Freezes and delegates bandwidth on the funder so the unfreeze and undelegate rows have something to act on |
| `src/fixtures/usdt-trc20.json` | Frozen mainnet bytecode of the canonical USDT contract (refresh command in the file's source comment) |
| `src/scenarii/tron.ts` | The scenario (TRX + TRC10 + TRC20 + resource staking) |

## Limitations

`claimReward` and `withdrawExpireUnfreeze` are not exercised. A reward only
accrues to a super representative's voters over whole maintenance cycles, and
Stake 2.0 pins `UnfreezeDelayDays` to a floor of one real day — no devnet can
shorten either, which is why the unfreeze row asserts the pending entry rather
than the returned TRX. The mapping those two modes rely on —
`familySpecificData` → `buildIntentData` → `TronTxData` — is covered by unit
tests in `ledger-live-common` (`families/tron/bridge/api.test.ts`) instead.

Clear-signing is likewise out of reach: the software signer has no device, so
the TRC-10 CAL-signature branch of the shipping signer
(`ledger-live-common/src/families/tron/signer.ts`) is never taken here.
