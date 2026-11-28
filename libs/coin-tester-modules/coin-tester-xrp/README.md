# @ledgerhq/coin-tester-xrp

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Deterministic integration tester for the XRP family. Asks coin-sandbox for a
rippled node in standalone mode and runs XRP, IOU and MPT scenarios through the
coin-framework bridge that ships in production.

## Run

```sh
pnpm coin:tester:xrp start
```

Requires coin-sandbox's server running (`deno task server` in its repository, port
8000; `COIN_SANDBOX_URL` points elsewhere) and a Docker daemon.
`COIN_SANDBOX_RIPPLE` gives the node version, e.g. `--node xrpld@3.4.1`. Each
scenario and test file asks for its own `ripple` instance and removes it at the end.
The MPT steps need `MPTokensV1`, which coin-sandbox's ledger file turns on.

Ledger Live signs with a software signer (`ripple-keypairs`), not the device: this
proves the bridge and coin-xrp, not what the XRP app accepts or shows.

## Coverage

Each scenario funds its own accounts and plays its steps in order. After each
step it checks the parent and token account rows, the token balance against the
ledger, and the reserve the account locks.

### XRP (`src/scenarii/xrp.ts`)

| # | Transaction | Asserts |
| --- | --- | --- |
| 1 | Send 10 XRP to a fresh recipient (creates the account) | exercises the "destination not created" branch — accepted because amount == base reserve. Asserts `OUT`, recipient matches, fee == 10 drops. |
| 2 | Send 1 XRP to the now-existing recipient | sub-reserve transfer to the same account. |
| 3 | Send 15 XRP with destination tag | tag carried in the payload. |
| 4 | Send 13.9 XRP (drains to ~reserve) | balance lands just above the 10 XRP base reserve. `useAllAmount` would be the natural expression, but `coin-xrp`'s `validateIntent` does not recompute amount for it (echoes the input), so a concrete amount is used instead. |

`coin-xrp` keeps a short-lived in-memory recipient cache; if this scenario becomes flaky when sending to a freshly-created account, consider bypassing the cache in the test setup (test-only) so pre-flight checks always hit `account_info` directly.

### IOU (`src/scenarii/xrpIou.ts`)

One issuer with a 0.5% transfer rate, clawback allowed, and three codes: `USD`,
`usd` (differs only by case) and `EUR`.

| # | Step | Asserts |
| --- | --- | --- |
| 1–2 | Opt in to `USD`, then `usd` | `OPT_IN` on the parent only, protocol-maximum limit, No Ripple set, one reserve increment more; two separate token accounts |
| 3 | The issuer pays 100 `USD` and 7 `usd`; send 10 `USD` to a second holder | `IN` rows; the `OUT` is valued 10.05, the transfer fee included |
| 4 | The issuer claws back; send max `USD` to the second holder | the clawback is an `OUT` the account did not sign; `SendMax` stays within the balance and the fee leaves dust |
| 5–6 | The issuer pays 1 `USD`; send max `USD`, then `usd`, to the issuer | no fee to the issuer: both balances reach 0, the `USD` line stays |
| 7 | Another wallet removes `usd`; opt in to `EUR` with No Rippling off | `OPT_OUT` on the parent and no `usd` account; the `TrustSet` has `tfClearNoRipple` |
| 8–10 | Lower the `EUR` limit, turn No Rippling on, then off | pending and synced rows are `OPT_EDIT` on the parent only; the line's limit and flag change on the ledger |
| 11 | Remove `EUR` | limit 0 with `tfSetNoRipple` only; the line and its token account are gone; one reserve increment less |

At the end the parent's balance is the funding minus every fee it paid.

### MPT (`src/scenarii/xrpMpt.ts`)

One issuance with a 1% transfer fee, scale 2, lock and clawback allowed.

| # | Step | Asserts |
| --- | --- | --- |
| 1 | Opt in (`MPTokenAuthorize`) | `OPT_IN`, the `MPToken` exists, one reserve increment more |
| 2 | The issuer pays 10000; send 1000 to a second holder | the `OUT` is valued 1010, the fee included |
| 3 | The issuer claws back; send max to the second holder | the clawback is an `OUT`; `SendMax` stays within the balance and 1 unit stays |
| 4 | Send max to the issuer | balance 0 |
| 5 | Remove (`tfMPTUnauthorize`) | the `MPToken` and its token account are gone; one reserve increment less |

### Refused sends (`src/negativeCases.test.ts`)

Each send checks its status only.

| Case | Error |
| --- | --- |
| IOU to an account with no line, MPT to one with no `MPToken` | `XrpRecipientTokenNotAdded` on `recipient` |
| From a frozen IOU line or a locked MPT holder, to a holder and to the issuer | `XrpTokenFrozen` on `amount` |

A freeze or a lock keeps the balance, makes none of it spendable and adds no operation. Unfreezing
or unlocking makes the send valid again.

### Token standards flag (`src/negativeCases.test.ts`)

An account holding `USD` and an MPT syncs with no token account when `enabledTokenStandards` is
unset, with `USD` only under `["iou"]`, and with both under `["iou","mpt"]`.

## Layout

| File | Role |
| --- | --- |
| `src/rippled.ts` | The sandbox node: start, RPC, local signing and submission, ledger reads |
| `src/signer.ts` | Software secp256k1 signer (via `ripple-keypairs`) implementing `XrpSigner` |
| `src/local-tx.ts` | Issuer and holder transactions outside Ledger Live: flags, lines, issuance, freeze, lock, clawback |
| `src/tokenFixtures.ts` | CAL token entries and the exact-match token store stub |
| `src/helpers.ts` | `getBridges(signer)`, the local currency config, funded wallets |
| `src/assert.ts` | Row and reserve assertions the token scenarios share |
| `src/fixtures.ts` | Currency, recipient, account factory |
| `src/scenarii/*.ts` | The XRP, IOU and MPT scenarios |
| `src/scenarii.test.ts` | Runs the scenarios |
| `src/negativeCases.test.ts` | Refused sends and the token standards flag, outside the scenario runner, which throws on any status error |

## Limitations

Escrow, checks, AMM, multisig, deep freeze and global freeze are not exercised. The device and
what it shows (for example "Clear No Ripple") are out of scope.
