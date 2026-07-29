# @ledgerhq/coin-tester-vechain

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Deterministic integration tester for the VeChain family. Spins up a local
`vechain/thor` solo node via Docker and runs a scenario through both the
legacy bridge and the generic coin-framework bridge (Alpaca/`CoinModuleApi`)
that ships in production.

## Run

```sh
pnpm coin:tester:vechain start
```

Requires a running Docker daemon. The coin module must be built first (`pnpm --filter coin-vechain build`).

## Coverage

A single scenario plays the transaction sequence below, in order, once per
strategy (`legacy`, `generic-adapter`).

| # | Transaction | Asserts |
| --- | --- | --- |
| 1 | Send 1 VET | `OUT` operation, recipient present, VET balance decreased by the sent amount, VTHO (fee currency) balance decreased |
| 2 | Send 10 VTHO | VTHO subAccount `OUT` operation, recipient present, VTHO balance decreased by at least the sent amount (gas is also paid in VTHO) |
| 3 | Send max VET | `OUT` operation, VET balance drained (gas is paid in VTHO, not deducted from VET), VTHO balance decreased |
| 4 | Send max VTHO | VTHO subAccount `OUT` operation, sent value strictly less than the full prior VTHO balance (gas reserved) and broadcast accepted, confirming `craftTransaction`'s max-send gas reservation |

Order matters: max VET runs before max VTHO so VTHO is still available to pay the VET send's gas
(the max VTHO send drains the VTHO balance down to the reserved fee).

## chainTag

VeChain embeds a `chainTag` in every signed transaction; the node rejects a
broadcast whose tag doesn't match its own genesis. `thor solo`'s genesis tag
isn't the mainnet value (`74`) that `coin-vechain` hardcoded, so this package
depends on making it configurable (see the co-located production change in
`@ledgerhq/coin-vechain`'s `config.ts` / `createTransaction.ts` /
`craftTransaction.ts`): the scenario reads the solo node's real genesis tag
(`GET /blocks/0`) and injects it for both strategies — via `createBridges`'s
`coinConfig` argument for `legacy`, via `LiveConfig` (`config_currency_vechain`)
for `generic-adapter`. Production is unaffected: no `chainTag` in the currency
config falls back to `74` (VeChain Live is mainnet-only).

## Layout

| File | Role |
| --- | --- |
| `src/thorNode.ts` | `docker compose` lifecycle + `waitForThorReady` (polls `/blocks/best`, reads the genesis chainTag from `/blocks/0`) |
| `src/signer.ts` | Software secp256k1 signer (via `@vechain/sdk-core`) implementing both the legacy `VechainSigner` and the generic-adapter signer contracts |
| `src/helpers.ts` | `getBridges(strategy, signer, chainTag)` — wires either the legacy bridge (adapted to `GenericTransaction`) or the generic coin-framework bridges |
| `src/fixtures.ts` | Currency, VTHO token, account factory, MSW bootstrap |
| `src/env.setup.ts` | Points `coin-vechain` at the local thor-solo REST endpoint before module eval |
| `src/scenarii/vechain.ts` | The VET + VTHO scenario |
| `docker-compose.yml` | `vechain/thor` solo service (single container, no miner/indexer needed — VeChain is PoA) |

## Limitations

Native VET and VIP180 (VTHO) transfers are exercised for both fixed and max-send amounts. Staking,
delegation (VIP-191 fee delegation / `gasPayer`), and multi-clause transactions are not covered by
this scenario.

## Assumptions / known-uncertain

- **thor-solo genesis accounts.** The scenario funds from thor-solo's well-known
  pre-funded dev accounts and deliberately avoids dev account `[0]` (it is the
  solo network's validator / block-signer / packing beneficiary, so its balance
  drifts from block rewards independently of any transaction). This was verified
  empirically (its balance changed between syncs with no transaction from it),
  not against `vechain/thor`'s `genesis/*.go` source — treat the "why" as
  best-effort; the workaround (use accounts `[1]`/`[2]`) holds regardless.
- **Log pagination.** This scenario stays well under the node's log limit, so the
  `getOperations`/`getTokenOperations` range-split path (Thor 403 "exceeds
  maximum") is not exercised here — it is covered deterministically by
  `@ledgerhq/coin-vechain`'s `network/sdk.test.ts` unit tests instead.
