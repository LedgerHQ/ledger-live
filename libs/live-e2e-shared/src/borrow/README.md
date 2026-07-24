# Borrow driver (Borrow API + Speculos)

Headless driver for the Borrow API that signs on **Speculos** — used to create/tear down on-chain loan state for the
repay/withdraw E2E tests.

It reuses the maintained EVM signing libraries directly — `@ledgerhq/live-signer-evm`
with the Speculos transport from `@ledgerhq/live-dmk-speculos`.

## Flows

- `open` — `supply` + `borrow`. **Always borrows USDT** (defaults to the WBTC/USDT market;
  `--market-id` overrides only for a deliberate exception). Skips if a position already exists
  (`--force` to override).
- `close` — `repay` then `withdraw`. **No-op if no loan is open.** By default closes the
  first open loan; pass `--all` to close every open loan, or `--market-id` to target one.
- `repay` / `withdraw` — the individual halves of `close` (also honor `--all` / `--market-id`).

## Usage

```bash
# from e2e/desktop
pnpm e2e borrow <open|close|repay|withdraw> [options]
```

Runs against the **staging** Borrow API, which builds **real Ethereum
mainnet** transactions. Options: `--account ETH_4`, `--rpc <url>` (an Ethereum RPC —
defaults to `https://ethereum-rpc.publicnode.com`; override via `--rpc` or `EVM_RPC_URL`),
`--dry-run` (sign but do not broadcast), `--force` (open despite an existing position),
`--all` (act on every position), and per-flow args `--market-id`, `--collateral-amount`,
`--loan-amount`, `--repay-amount`, `--withdraw-amount`.

`SEED` comes from the environment.

```bash
# Close (repay + withdraw) whatever is open for ETH_4; no-op if nothing open
pnpm e2e borrow close --rpc "$EVM_RPC_URL"

# Open a USDT loan (WBTC collateral) — the default market; always borrows USDT
pnpm e2e borrow open --force \
  --collateral-amount 0.0002 --loan-amount 1 --rpc "$EVM_RPC_URL"
```

## Use in E2E before/after hooks

The flow logic is exported from `borrowFlow.ts` as an awaitable API (no
`process.argv`, no `process.exit`) — safe to call from Playwright hooks. It boots
and tears down its own Speculos by default; pass `speculosApiPort` to reuse an
already-running device.

```ts
import { openBorrowPosition, closeBorrowPosition } from "@ledgerhq/live-e2e-shared/borrow/borrowFlow";

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

### `@ledgerhq/live-e2e-shared/borrow/borrowSetup` helper

For specs, prefer the ready-made wrappers in `borrowSetup` — they default the
account to `ETH_4`, read the RPC from `EVM_RPC_URL`, and **no-op when broadcast is disabled**
(`DISABLE_TRANSACTION_BROADCAST !== "0"`), so a hook can't try to broadcast in a run where the
test itself is skipped:

- `ensureLoanOpen()` — `beforeAll` precondition for **withdraw / close-loan** specs (signs a real
  open so the UI has a position to act on). Idempotent: no-op if a loan is already open.
- `resetLoanState()` — `before` / `after` reset for the **open-loan** spec (repays + withdraws
  everything → account back to zero). Idempotent: no-op if nothing is open.

Per-test roles:

| Spec             | Hook                        | Why                                          |
| ---------------- | --------------------------- | -------------------------------------------- |
| open-loan        | `beforeAll(resetLoanState)` | start from zero so the UI opens a fresh loan |
| withdraw / close | `beforeAll(ensureLoanOpen)` | precondition a loan for the UI to act on     |

```ts
import { resetLoanState } from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";

test.beforeAll(async () => {
  test.setTimeout(600_000); // an open is 3 mainnet txs (~6 min)
  await resetLoanState(); // ETH_4, EVM_RPC_URL; no-op if broadcast is off
});
```

### Collision risks & serialization (shared ETH_4)

All borrow on-chain flows share the single funded account **ETH_4**, so they must **never run
against it in parallel**. `playwright.config.ts` is `fullyParallel: true`, `workers: "100%"`, and
`test.describe.configure({ mode: "serial" })` only serializes tests **within one file**. Therefore:

- **Keep all borrow on-chain flows (open / withdraw / close) in the single `borrow.spec.ts`**, under
  one top-level `test.describe.configure({ mode: "serial" })`. Two specs touching ETH_4 at once →
  nonce + on-chain state races (flaky, failed real-fund txs). (Scalable alternative if they must be
  separate files: a dedicated Playwright project with `fullyParallel: false`, `workers: 1`,
  `testMatch: /borrow\..*\.spec\.ts/`.)
- **Same-SEED = same address.** The helper signs on a Speculos seeded from `SEED`, the same env the
  desktop harness uses — so within one run the setup loan lands on exactly the ETH_4 the UI shows.
  Running the tool with a different `SEED` than the app would open on a different, invisible address.
- **Real funds, slow.** Each open is 3 mainnet txs (~6 min); raise the hook timeout with
  `test.setTimeout(...)` **inside** the hook. Manual/nightly `enable_broadcast` lane only.
- **Funding.** ETH_4 must hold wBTC collateral + ETH for gas **plus a small USDT/USDC buffer** —
  `resetLoanState` repays debt **+ accrued interest**, and an exactly-principal balance reverts with
  `transferFrom reverted`. Runner also needs `COINAPPS` + Docker (Speculos).

## Required environment

| Var                     | Purpose                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `SEED`                  | BIP39 mnemonic Speculos signs with (its derived EVM address must hold the loan + gas). |
| `COINAPPS`              | Folder of Speculos app ELFs (`LedgerHQ/coin-apps` layout).                             |
| `EVM_RPC_URL` / `--rpc` | Ethereum RPC to build (gas/nonce) + broadcast. Optional; defaults to publicnode.       |
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
