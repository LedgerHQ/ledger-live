# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

E2E Playwright test suite for the **Ledger Live Desktop** app (Electron). Tests run against a real Electron build and use **Speculos** (Docker-based hardware wallet simulator) for device interactions.

All commands below are run from the **repo root** (`ledger-live/`), not from this directory.

---

## Commands

### Run Tests

```bash
pnpm e2e:desktop test:playwright                                    # All tests
pnpm e2e:desktop test:playwright <testFileName>                     # Single file
pnpm e2e:desktop test:playwright --grep "@smoke"                    # By tag
pnpm e2e:desktop test:playwright --grep "Ethereum"                  # By test name pattern
PWDEBUG=1 DEV_TOOLS=1 pnpm e2e:desktop test:playwright <file>      # Debug mode
DISABLE_TRANSACTION_BROADCAST=1 pnpm e2e:desktop test:playwright   # No real tx
```

### Lint / Typecheck

```bash
pnpm e2e:desktop lint
pnpm e2e:desktop lint:fix
pnpm e2e:desktop typecheck
```

### Build (required before first run and after source changes)

```bash
pnpm i --filter="ledger-live-desktop..." --filter="live-cli..." --filter="ledger-live" --filter="@ledgerhq/dummy-*-app..." --filter="ledger-live-desktop-e2e-tests" --unsafe-perm
pnpm build:lld:deps
pnpm build:cli
pnpm desktop build:testing
pnpm e2e:desktop test:playwright:setup   # Install Playwright Chromium
```

**After editing shared enums** (`libs/ledger-live-common/src/e2e/enum/`), rebuild that package — Playwright uses the compiled `lib/` output, not the TypeScript source:

```bash
pnpm --filter @ledgerhq/live-common build
```

### Allure Reports

```bash
pnpm e2e:desktop allure           # Generate + open
pnpm e2e:desktop allure:generate
pnpm e2e:desktop allure:open
```

---

## Environment Variables

Required for Speculos mode (`MOCK=0`):

| Variable             | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| `MOCK`               | `0` = Speculos (real simulation), `1` = mock mode                |
| `COINAPPS`           | Path to cloned `LedgerHQ/coin-apps` repo                         |
| `SPECULOS_IMAGE_TAG` | Docker image, e.g. `ghcr.io/ledgerhq/speculos:latest`            |
| `SPECULOS_DEVICE`    | `nanoSP` \| `nanoX` \| `nanoS` \| `stax` \| `flex` \| `nanoGen5` |

Optional:

| Variable                        | Description                                         |
| ------------------------------- | --------------------------------------------------- |
| `E2E_ENABLE_WALLET40`           | `1` to force Wallet 4.0 on (off by default)         |
| `DISABLE_TRANSACTION_BROADCAST` | `1` to prevent real transaction broadcast           |
| `SPECULOS_FIRMWARE_VERSION`     | Override firmware version (auto-detected otherwise) |

---

## Architecture

### Page Object Model

Tests use a hierarchical POM:

```
PageHolder (base)
  └── Component
        └── AppPage
              └── Specific Pages (AccountPage, SwapPage, etc.)
```

The `Application` class (`tests/page/Application.ts`) is the top-level facade that aggregates all page objects. Tests access everything through the `app` fixture.

### Key Directories

```
tests/
├── specs/          # Test files — one feature per file
├── page/           # Page objects
│   ├── drawer/     # Slide-in drawer components
│   ├── modal/      # Modal dialogs
│   └── dialog/     # Full-screen dialogs
├── component/      # Shared layout/modal/drawer base components
├── fixtures/       # common.ts — Playwright test fixtures
├── utils/          # Helpers: electronUtils, speculosUtils, cliUtils, featureFlagUtils, allureUtils, etc.
├── userdata/       # JSON fixtures for pre-configured app states (accounts, etc.)
└── testdata/       # Test data configs
```

### Fixtures (`tests/fixtures/common.ts`)

Extends Playwright's `base.extend`. Key fixture properties:

- `app` — `Application` instance (main entry point in tests)
- `userdata` — name of a pre-built userdata JSON from `tests/userdata/`
- `speculosApp` — hardware simulator config (from `Currency.X.speculosApp`)
- `featureFlags` — feature flag overrides
- `cliCommands` — CLI commands to run before/after test
- `electronApp`, `page` — raw Playwright handles

Each test gets an isolated userdata directory at `artifacts/userdata/{UUID}/app.json`.

### Step Decorator

Methods on page objects can be annotated with `@step("description")` (from `tests/misc/reporters/`). This wraps them in `test.step()` for Allure reporting. Use `$0`, `$1`, etc. for parameter substitution.

### Speculos Integration

Speculos runs in Docker. `speculosUtils.ts` handles container lifecycle (`launchSpeculos` / `killSpeculos`). `cliUtils.ts` handles the Ledger CLI for device operations.

Stale containers from interrupted runs cause port conflicts — clean up with:

```bash
docker rm -f $(docker ps -a --filter name=speculos -q)
```

### Feature Flags

The `lldModularDrawer` flag is enabled by default in tests (controls modular UI components). Individual tests can override flags via the `featureFlags` fixture.

---

## Shared E2E Enums (`libs/ledger-live-common/src/e2e/`)

These enums are **shared with mobile E2E**. All imports in specs use `@ledgerhq/live-common/e2e/enum/X`.

### `enum/Account.ts` — Test accounts

**`Account`** (native coins):

- BTC: `BTC_LEGACY_1/2`, `BTC_SEGWIT_1/2`, `BTC_NATIVE_SEGWIT_1/2`, `BTC_TAPROOT_1/2`
- ETH: `ETH_1`, `ETH_2`, `ETH_2_WITH_ENS`, `ETH_3`, `SANCTIONED_ETH`
- SOL: `SOL_1/2/3/4` — ADA: `ADA_1/2` — DOT: `DOT_1/2/3` — XRP: `XRP_1/2/3`
- TRX: `TRX_1/2/3` — XLM: `XLM_1/2` — ALGO: `ALGO_1/2` — ATOM: `ATOM_1/2`
- DOGE: `DOGE_1/2` — BCH: `BCH_1/2` — BSC: `BSC_1/2` — POL: `POL_1/2`
- KASPA: `KASPA_1/2` — NEAR: `NEAR_1/2` — OSMO: `OSMO_1/2` — MULTIVERS_X: `MULTIVERS_X_1/2`
- ZEC: `ZEC_1/2` — SUI: `SUI_1/2` — VET: `VET_1/2` — ICP: `ICP_1/2`
- BASE: `BASE_1/2` — sep_ETH: `sep_ETH_1/2` — APTOS: `APTOS_1/2` — XTZ: `XTZ_1/2`
- LTC: `LTC_1` — CELO: `CELO_1` — OP: `OP_1` — INJ: `INJ_1`
- HEDERA: `HEDERA_1/2` (hardcoded addresses — cannot be derived from path)
- `EMPTY` (used for invalid address tests)

**`TokenAccount`** (ERC-20 / SPL / TRC-20 tokens, parent account required):

- ETH tokens: `ETH_LIDO`, `ETH_USDC_1`, `ETH_USDT_1/2/3`
- SOL tokens: `SOL_GIGA_1/2/3`, `SOL_WIF_1/2`
- TRX tokens: `TRX_BTT`, `TRX_USDT`
- SUI tokens: `SUI_USDC_1/2`
- BSC tokens: `BSC_BUSD_1/2`
- ALGO tokens: `ALGO_USDT_1/2`
- XLM tokens: `XLM_USDC`
- POL tokens: `POL_DAI_1`, `POL_UNI`

Helper: `getParentAccountName(account)` — returns parent account name for token accounts.

### `enum/Currency.ts` — Currencies

Each `Currency` has: `name`, `ticker`, `id` (Ledger Live registry ID), `speculosApp`, `networks[]`, optional `contractAddress`.

**Native coins:** BTC, ETH, SOL, ADA, DOT, TRX, XRP, XLM, ALGO, ATOM, BSC, POL, XTZ, DOGE, BCH, LTC, CELO, APT, KAS, HBAR, ZEC, INJ, VET, ICP, SUI, BASE, OP, NEAR, OSMO, MULTIVERS_X, TON, ALEO, tBTC, sepETH

**Tokens:** ETH_USDT, ETH_USDC, ETH_LIDO, SOL_GIGA, SOL_WIF, BSC_BUSD, TRX_BTT, TRX_USDT, SUI_USDC, ALGO_USDT, XLM_USDC, POL_DAI, POL_UNI

The `id` field must match Ledger Live's coin registry exactly. Token IDs follow the pattern `"<chain>/erc20/<token_name>"` (e.g. `"ethereum/erc20/usd_tether__erc20_"`).

### `enum/Fee.ts`

```
Fee.FAST | Fee.MEDIUM | Fee.SLOW
```

### `enum/TokenType.ts`

```
TokenType.ERC20 | TokenType.TRC20 | TokenType.SPL | TokenType.SUI
```

### `enum/Device.ts`

```
Device.LNS (nanoS) | Device.LNX (nanoX) | Device.LNSP (nanoSP)
Device.STAX (stax) | Device.FLEX (flex) | Device.NANO_GEN_5 (nanoGen5)
```

### `enum/Provider.ts`

- Swap: Changelly, Exodus, 1inch, Velora, MoonPay, THORChain, Uniswap, LI.FI, CIC, OKX
- Buy/Sell: Revolut, Mercuryo, Transak, Topper, Coinbase, Coinify, Ramp Network, Sardine
- Earn: Kiln, Stader Labs, Lido
- `Rate.FIXED | Rate.FLOAT`

### `enum/DeviceLabels.ts`

76 string constants for screen text matching (e.g. `ACCEPT`, `APPROVE`, `SIGN`, `VERIFY_ADDRESS`, `REVIEW_TRANSACTION`, `HOLD_TO_SIGN`, `FEES`, `AMOUNT`, ...). Used by family implementations to validate device screens.

### `enum/TransactionStatus.ts`

```
RECEIVED | DELEGATED | NFT_RECEIVED | SENT | SEND | FEES | STAKED | SENDING | TRANSACTION_SENT | CONFIRMED
```

### `models/` — Data models

```typescript
Transaction(accountToDebit, accountToCredit, amount, speed?, memoTag?)
  // accountToDebit/Credit: AccountType (Account | TokenAccount)
  // .recipientAddress can be set after construction

Swap extends Transaction
  // .amountToReceive, .feesAmount (set via setters)

Delegate(account, amount, provider)

BuySell({ crypto, fiat: { locale, currencyTicker }, amount, operation })
```

### `families/` — Device signing implementations

21 files, one per blockchain (e.g. `evm.ts`, `bitcoin.ts`, `solana.ts`). Each exports functions like `sendBTC`, `sendETH` etc., which are called via `app.speculos.signSendTransaction(tx)` in tests. Touch devices (Stax, Flex) use swipe/long-press; button devices use left/right/both button presses. To add support for a new chain's device interaction, add a file here.

---

## Adding a New Currency or Token to Tests

Requires **3 file changes** + **1 rebuild**:

1. **`libs/ledger-live-common/src/e2e/enum/Currency.ts`**

   - Native: `new Currency(name, ticker, id, AppInfos.X, [Network.X])`
   - Token: add `contractAddress` as 6th arg; use parent chain's `AppInfos` (e.g. `AppInfos.ETHEREUM` for all ERC-20s)

2. **`libs/ledger-live-common/src/e2e/enum/Account.ts`**

   - Native → add to `Account` class
   - Token → add to `TokenAccount` class: `new TokenAccount(Currency.X, "Name N", index, Account.ETH_N.accountPath, TokenType.ERC20, Account.ETH_N)`
   - Always create at least `_1` and `_2` entries (sender and recipient)

3. **Spec file** (`tests/specs/send.tx.spec.ts` or other)

   - Add entry to the appropriate array (`transactionE2E`, etc.)
   - Import `TokenAccount` alongside `Account` if needed
   - Use `"B2CQA-XXXX"` as `xrayTicket` placeholder until a real ticket exists

4. **Rebuild** — Playwright resolves `@ledgerhq/live-common` to compiled `lib/`, not source:
   ```bash
   pnpm --filter @ledgerhq/live-common build
   ```
   Without this, new static fields on `Account`/`Currency` will be `undefined` at runtime, causing `TypeError: Cannot read properties of undefined (reading 'currency')` in the test loop.

---

## Interactive Setup

For guided environment setup (checks Docker, env vars, builds app, runs smoke test):

```
/e2e-desktop-onboard
```

---

## Common Issues

- **New enum entry is `undefined` at runtime**: rebuild `live-common` — see "Adding a New Currency" above.
- **`.DS_Store` in coin-apps**: `find $COINAPPS -name ".DS_Store" -type f -delete`
- **Speculos version mismatch**: `cd $COINAPPS && git pull origin master`
- **OOM during build**: prefix with `NODE_OPTIONS="--max-old-space-size=10240"`
- **Stale dist after branch switch**: `rm -rf apps/ledger-live-desktop/dist` then rebuild
- **Stale Speculos containers**: `docker rm -f $(docker ps -a --filter name=speculos -q)`
