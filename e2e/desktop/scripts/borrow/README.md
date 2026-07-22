# Borrow driver (Borrow API + Speculos)

Headless driver for the Borrow (partner) API that signs on **Speculos** (emulated
Ledger, no physical device) — used to create/tear down on-chain loan state so the
repay/withdraw E2E tests (B2CQA-6073 / B2CQA-6080) are unblocked. See
[QAA-1401](https://ledgerhq.atlassian.net/browse/QAA-1401).

It reuses the maintained EVM signing libraries directly — `@ledgerhq/live-signer-evm`
with the Speculos transport from `@ledgerhq/live-dmk-speculos` — and **not** the
deprecated `apps/cli`.

## Flows

- `open` — `supply` + `borrow`. **Always borrows USDT** (defaults to the WBTC/USDT market;
  `--market-id` overrides only for a deliberate exception). Skips if a position already exists
  (`--force` to override).
- `close` — `repay` then `withdraw`. **No-op if no loan is open.** By default closes the
  first open loan; pass `--all` to close every open loan, or `--market-id` to target one.
- `repay` / `withdraw` — the individual halves of `close` (also honor `--all` / `--market-id`).

## Usage

```bash
pnpm --filter ledger-live-desktop-e2e-tests borrow <open|close|repay|withdraw> [options]
```

Runs against the **staging** Borrow API (keyless), which builds **real Ethereum
mainnet** transactions. Options: `--account ETH_4`, `--rpc <url>` (an Ethereum RPC),
`--dry-run` (sign but do not broadcast), `--force` (open despite an existing position),
`--all` (act on every position), and per-flow args `--market-id`, `--collateral-amount`,
`--loan-amount`, `--repay-amount`, `--withdraw-amount`.

`SEED` comes from the environment — see [Secrets](#secrets) below. Never pass it on the
command line. `--rpc` is not a secret.

```bash
# Close (repay + withdraw) whatever is open for ETH_4; no-op if nothing open
pnpm --filter ledger-live-desktop-e2e-tests borrow close --rpc "$EVM_RPC_URL"

# Open a USDT loan (WBTC collateral) — the default market; always borrows USDT
pnpm --filter ledger-live-desktop-e2e-tests borrow open --force \
  --collateral-amount 0.0002 --loan-amount 1 --rpc "$EVM_RPC_URL"
```

## Secrets

`SEED` is read from the **environment only** — never a CLI flag, never logged, never
committed. Keep it out of the command line (and thus out of shell history / CI logs):

- **Locally:** put it in your shell profile, or a **gitignored** `.env` at the repo
  root (`.env` is already in `.gitignore`) — never a tracked file.
- **CI:** set it as a **masked repository secret** and expose it as an env var for the
  step that runs the driver. Do not `echo` it.

(The staging API needs no key, so there is no `BORROW_API_KEY`.)

## Use in E2E before/after hooks

The flow logic is exported from `borrowFlow.ts` as an awaitable API (no
`process.argv`, no `process.exit`) — safe to call from Playwright hooks. It boots
and tears down its own Speculos by default; pass `speculosApiPort` to reuse an
already-running device.

```ts
import { openBorrowPosition, closeBorrowPosition } from "../../scripts/borrow/borrowFlow";

const rpcUrl = process.env.EVM_RPC_URL!;

test.beforeAll(async () => {
  // defaults to the WBTC/USDT market — always a USDT loan
  await openBorrowPosition({
    rpcUrl,
    account: "ETH_4",
    collateralAmount: "0.0002",
    loanAmount: "1",
  });
});

test.afterAll(async () => {
  await closeBorrowPosition({ rpcUrl, account: "ETH_4" }); // no-op if nothing open
});
```

`runBorrow(options)` is the general entry (`flow: "open" | "close" | "repay" | "withdraw"`);
`openBorrowPosition` / `closeBorrowPosition` are thin wrappers. All options mirror the
CLI flags.

## Required environment

| Var                     | Purpose                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `SEED`                  | BIP39 mnemonic Speculos signs with (its derived EVM address must hold the loan + gas). |
| `COINAPPS`              | Folder of Speculos app ELFs (`LedgerHQ/coin-apps` layout).                             |
| `EVM_RPC_URL` / `--rpc` | Ethereum RPC used to build (gas/nonce) and broadcast the signed tx.                    |
| `SPECULOS_DEVICE`       | Device model (default nanoSP). Optional.                                               |
| `BORROW_MANUAL_APPROVE` | Set to skip auto-approval and confirm on the device by hand (via VNC).                 |

## Notes / to confirm

- **Staging builds real Ethereum mainnet transactions** — broadcasts move real funds and are
  irreversible. The no-op guards make an account with nothing to do safe; validate first with
  `--dry-run` (signs, does not broadcast). The staging API itself is keyless.
- To fully `repay`/`close`, the wallet needs the debt token **plus a hair for accrued interest**
  (`repayAll` pulls debt + interest via `transferFrom`, which reverts if the wallet is short).
- Endpoints/shapes/args verified against staging: `repay` takes `{ marketId, repayAll | amount }`,
  `withdraw` takes `{ marketId, amount }` (no `withdrawAll`), and `POST /v1/actions` returns the
  full `steps[]` upfront (no `/step` loop needed). `marketId` is the long position `marketId`;
  `open` uses a market's `collateral[].id`. Auto-detection can be overridden with `--market-id`.
- Position detection is balance-aware: `repay` acts on debt, `withdraw` on collateral, `close` on
  either — so a fully-repaid, collateral-only position is still withdrawable.
- Arbitrary borrow calldata (e.g. the Morpho `repay`) requires **Blind signing enabled** on the
  Speculos Ethereum app, or the device rejects with `6a80`. The ERC-20 approval clear-signs.
- Auto-approval walks the review carousel to the **"Sign transaction"** screen and presses both
  (nanoSP). Confirm labels vary by device model; use `BORROW_MANUAL_APPROVE=1` to confirm by hand.
- A full dry-run close (`--dry-run`) is validated end-to-end: approval + repay + withdraw all sign
  on Speculos and produce valid signed transactions (no broadcast).
