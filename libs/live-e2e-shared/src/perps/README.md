# Perps driver (Perps API + Speculos)

Headless driver for the Perps live app's API. It closes the positions and cancels the orders
that the Perps e2e tests leave, without the Ledger Wallet UI.

It signs with the **Hyperliquid** app on Speculos through the same call as Ledger Wallet
(`signActionsOnSession` in `@ledgerhq/live-common/wallet-api/Perps/server`), so no extra key is
needed: the Speculos seed signs, as in the UI tests.

> ⚠️ The API is the staging live app proxy (`perps.live.ledger-test.com`), but orders reach
> **Hyperliquid mainnet** with real funds.

## Safety

- Only `close` and `cancelOrder` are ever submitted. Any other action, `open` included, is
  signed in a dry run only ([`perpsRequests.ts`](./perpsRequests.ts)).
- Every signature must recover to `--address` before it is submitted
  ([`perpsSignature.ts`](./perpsSignature.ts)).
- Signing refuses to start while the device already shows a review.
- `sign-check` is always a dry run.

## Usage

```bash
pnpm -w e2e-cli perps <status|sweep|sign-check> --address <0x…> [options]
```

| Flow | Does |
| --- | --- |
| `status` | Prints the positions and orders, signs nothing. |
| `sweep` | Closes every position, then cancels every order. Add `--dry-run` to sign only. |
| `sign-check` | Signs a small open order and never submits it, to check the signing path. |

Options: `--account <Account key>` (default `HYPERCORE_1`), `--catalog <nano-app-catalog.json>`,
`--speculos-port <port>` to reuse a running Speculos on the Hyperliquid app, `--market-id`
(`sign-check` only), `--api-url`.

`sweep` touches **every** position of the account, those of a concurrent run included. Run it by
hand only, for example after a failed cleanup.

## Use in e2e hooks

`closePerpsMarkets` from [`perpsFlow.ts`](./perpsFlow.ts) closes the given markets on the test's
own Speculos, then waits until the API lists no position there. The desktop Perps specs call it
from `afterEach` through `closePerpsPositionsOpenedByTest`
([`perpsPositionFlows.ts`](../../../../e2e/desktop/tests/utils/perpsPositionFlows.ts)), for the
markets that had no position when the test started.

## Required environment

- `SEED`: the Speculos seed, only when the driver starts its own Speculos.
- `COINAPPS`, `SPECULOS_IMAGE_TAG`, `SPECULOS_DEVICE`: as for any Speculos run.
- `--catalog` or `E2E_NANO_APP_VERSION_PATH`: the app version catalog.

## Tests

`pnpm --filter @ledgerhq/live-e2e-shared test` runs the unit tests, which fake the API and the
device ([`perpsRunner.test.ts`](./perpsRunner.test.ts), [`perpsSigning.test.ts`](./perpsSigning.test.ts)).
