# @ledgerhq/coin-tester-xrp

Deterministic integration tester for the XRP family. Spins up a local rippled
node in standalone mode via Docker and runs a single scenario through the
coin-framework bridge that ships in production.

## Run

```sh
pnpm coin:tester:xrp start
```

Requires a running Docker daemon. Boot takes ~10 s; full suite ~30 s.

## Coverage

A single scenario plays the full transaction sequence below, in order, against
the same Docker boot.

| # | Transaction | Asserts |
| --- | --- | --- |
| 1 | Send 10 XRP to a fresh recipient (creates the account) | exercises the "destination not created" branch — accepted because amount == base reserve. Asserts `OUT`, recipient matches, fee == 10 drops. |
| 2 | Send 1 XRP to the now-existing recipient | sub-reserve transfer to the same account. |
| 3 | Send 15 XRP with destination tag | tag carried in the payload. |
| 4 | Send 13.9 XRP (drains to ~reserve) | balance lands just above the 10 XRP base reserve. `useAllAmount` would be the natural expression, but `coin-xrp`'s `validateIntent` does not recompute amount for it (echoes the input), so a concrete amount is used instead. |

`coin-xrp` keeps a short-lived in-memory recipient cache; if this scenario becomes flaky when sending to a freshly-created account, consider bypassing the cache in the test setup (test-only) so pre-flight checks always hit `account_info` directly.

## Layout

| File | Role |
| --- | --- |
| `src/rippled.ts` | `docker compose` lifecycle, genesis funding via the master passphrase account, `ledger_accept` advance, `tx` polling |
| `src/signer.ts` | Software secp256k1 signer (via `ripple-keypairs` + `ripple-binary-codec`) implementing `XrpSigner` |
| `src/helpers.ts` | `getBridges(signer)` — wires the generic coin-framework bridges with the local node URL |
| `src/fixtures.ts` | Currency, recipient, genesis account, account factory |
| `src/scenarii/xrp.ts` | Single scenario combining the full transaction sequence |
| `rippled.cfg` | Minimal config exposing admin JSON-RPC :5005 and admin WS :6006 |
| `docker-compose.yml` | rippled standalone service |

## Limitations

Trustlines, escrow, checks, AMM, and multisig are not exercised. Production
Live screens for those flows are dormant; covering them deterministically
would require additional fixtures and bridge support.
