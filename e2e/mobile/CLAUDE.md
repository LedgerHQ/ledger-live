# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

E2E Detox test suite for the **Ledger Live Mobile** app (iOS & Android). Tests run against a real app build and use **Speculos** (Docker-based hardware wallet simulator) for device interactions.

Commands to run tests are executed from **`e2e/mobile/`**. Build commands are run from the **repo root** (`ledger-live/`).

---

## Commands

### Run Tests

All commands below are run from `e2e/mobile/`.

```bash
pnpm test:android specs/send/sendBTC.spec.ts    # Single file, Android release (recommended locally)
pnpm test:ios specs/send/sendBTC.spec.ts        # Single file, iOS release
pnpm test:ios:debug specs/send/sendBTC.spec.ts  # Single file, iOS debug (requires Metro bundler)
pnpm test:android                               # All tests, Android release
pnpm test:ios                                   # All tests, iOS release
```

For iOS debug mode, start Metro bundler first (from repo root):

```bash
pnpm mobile start
```

Filter by pattern (Jest glob):

```bash
pnpm test:android "send"              # matches any file with "send" in name
pnpm test:android "**/send/**"        # matches all send tests
pnpm test:detox --configuration android.emu.release -- --testNamePattern="should send"
```

> **Note:** `android.emu.debug` is broken locally — use `android.emu.release` instead.

### Lint / Typecheck

```bash
pnpm lint
pnpm lint:fix
pnpm typecheck
```

### Build (required before first run and after source changes)

From **repo root**:

```bash
pnpm i --filter="live-mobile..." --filter="ledger-live" --filter="live-cli..." --filter="ledger-live-mobile-e2e-tests"
pnpm build:llm:deps
pnpm build:cli
pnpm mobile e2e:build -c android.emu.release   # or ios.sim.debug, ios.sim.release
```

**After editing shared enums** (`libs/ledger-live-common/src/e2e/enum/`), rebuild that package — Detox uses the compiled `lib/` output, not the TypeScript source:

```bash
pnpm --filter @ledgerhq/live-common build
```

### Allure Reports

```bash
pnpm allure           # Generate + open
pnpm allure:generate
pnpm allure:open
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

| Variable                        | Description                               |
| ------------------------------- | ----------------------------------------- |
| `E2E_ENABLE_WALLET40`           | `1` to enable Wallet 4.0 feature tests    |
| `DISABLE_TRANSACTION_BROADCAST` | `1` to prevent real transaction broadcast |

---

## Architecture

### Page Object Model

Tests use the `Application` class (`page/index.ts`) as the top-level facade with lazy-initialized page objects. All page interactions go through `app`:

```typescript
await app.init({ speculosApp: account.currency.speculosApp, cliCommands: [...] });
await app.portfolio.waitForPortfolioPageToLoad();
await app.send.openViaDeeplink();
```

### Key Directories

```
e2e/mobile/
├── specs/           # Test files — organized by feature (send/, addAccount/, swap/, etc.)
├── page/            # Page Object Model classes
│   ├── accounts/    # Account list, individual account, add account
│   ├── trade/       # Send, receive, swap, stake, buy/sell
│   ├── settings/    # Settings & preferences
│   ├── wallet/      # Portfolio, tab navigation
│   └── index.ts     # Application facade (entry point for tests)
├── helpers/         # Element interaction utilities
│   ├── elementHelpers.ts   # NativeElementHelpers + WebElementHelpers
│   ├── commonHelpers.ts    # launchApp, openDeeplink, isAndroid/isIos
│   └── allure/      # Allure step decorators & attachments
├── utils/           # speculosUtils, cliUtils, initUtil, loggingUtils
├── models/          # Data models (Transaction, Swap, Delegate, BuySell)
├── userdata/        # Pre-configured app state JSON fixtures
├── bridge/          # WebSocket bridge to mobile app
└── types/           # TypeScript type definitions
```

### Element Helpers

**Native (iOS/Android):** `NativeElementHelpers` from `helpers/elementHelpers.ts`

- `tapById`, `tapByText`, `typeTextById`, `waitForElementById`, `scrollToId`, `IsIdVisible`, etc.

**Web (embedded webviews):** `WebElementHelpers` from `helpers/elementHelpers.ts`

- `tapWebElementByTestId`, `typeTextByWebTestId`, `waitWebElementByTestId`, `getCurrentWebviewUrl`, etc.

### Test Initialization & Userdata

Each test gets its own temp copy of a userdata JSON. Common fixtures in `userdata/`:

- `skip-onboarding.json` — default, starts at portfolio
- `1AccountBTC1AccountETHReadOnlyFalse.json`, `EthAccountXrpAccountReadOnlyFalse.json`, etc.

CLI-based account setup (for Speculos tests):

```typescript
await app.init({
  speculosApp: account.currency.speculosApp,
  cliCommands: [
    async userdataPath =>
      CLI.liveData({
        currency: account.currency.id,
        index: account.index,
        appjson: userdataPath,
        add: true,
      }),
  ],
});
```

### Speculos Integration

Speculos runs in Docker. `utils/speculosUtils.ts` manages container lifecycle. Stale containers from interrupted runs cause port conflicts — clean up with:

```bash
docker rm -f $(docker ps -a --filter name=speculos -q)
```

---

## Test Patterns

### Spec File Structure

Most tests use a **runner pattern** — a shared `runXxxTest()` function in a companion `.ts` file, called by thin spec files per currency:

```typescript
// specs/send/sendBTC.spec.ts
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(
  Account.BTC_NATIVE_SEGWIT_1,
  Account.BTC_NATIVE_SEGWIT_2,
  "0.0001",
);
runSendTest(
  transaction,
  ["B2CQA-2809"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bitcoin"],
);
```

### Tagging

- Device tags: `@NanoSP`, `@NanoX`, `@Stax`, `@Flex`, `@NanoGen5`, `@LNS`
- Currency/family tags: `@bitcoin`, `@ethereum`, `@family-bitcoin`, `@family-evm`, etc.
- TMS links: `$TmsLink("B2CQA-XXXX")` for test case tracking

### Skipping Tests

- Rename file to `.skip.spec.ts` to exclude from all CI runs
- Use `describe.skip()` for conditional in-code disabling

---

## Shared E2E Enums (`libs/ledger-live-common/src/e2e/`)

Shared with desktop E2E. All imports use `@ledgerhq/live-common/e2e/enum/X`.

### `enum/Account.ts` — Test accounts

**`Account`** (native coins): `BTC_NATIVE_SEGWIT_1/2`, `ETH_1/2/3`, `SOL_1/2`, `ADA_1/2`, `DOT_1/2/3`, `XRP_1/2/3`, `TRX_1/2/3`, `XLM_1/2`, `ATOM_1/2`, `DOGE_1/2`, `BCH_1/2`, `BSC_1/2`, `POL_1/2`, `KASPA_1/2`, `NEAR_1/2`, `SUI_1/2`, `HEDERA_1/2` (hardcoded addresses), etc.

**`TokenAccount`** (ERC-20 / SPL / TRC-20 tokens): `ETH_USDC_1`, `ETH_USDT_1/2/3`, `SOL_GIGA_1/2/3`, `TRX_USDT`, `BSC_BUSD_1/2`, `POL_DAI_1`, etc.

### `enum/Currency.ts`

Each `Currency` has: `name`, `ticker`, `id` (Ledger Live registry ID), `speculosApp`, `networks[]`, optional `contractAddress`. Token IDs follow `"<chain>/erc20/<token_name>"` pattern.

### Other enums

- `Fee.FAST | Fee.MEDIUM | Fee.SLOW`
- `TokenType.ERC20 | TokenType.TRC20 | TokenType.SPL | TokenType.SUI`
- `Device.LNS | Device.LNX | Device.LNSP | Device.STAX | Device.FLEX | Device.NANO_GEN_5`
- `DeviceLabels` — 76 string constants for screen text matching
- `TransactionStatus` — `RECEIVED | SENT | FEES | CONFIRMED | ...`

### `models/` — Data models

```typescript
Transaction(accountToDebit, accountToCredit, amount, speed?, memoTag?)
Swap extends Transaction  // .amountToReceive, .feesAmount via setters
Delegate(account, amount, provider)
BuySell({ crypto, fiat: { locale, currencyTicker }, amount, operation })
```

### `families/` — Device signing implementations

One file per blockchain (e.g. `evm.ts`, `bitcoin.ts`, `solana.ts`). Touch devices (Stax, Flex) use swipe/long-press; button devices use button presses. Called via `app.speculos.signSendTransaction(tx)`. Add a new file here to support a new chain's device interactions.

---

## Adding a New Currency or Token to Tests

Requires **3 file changes** + **1 rebuild**:

1. **`libs/ledger-live-common/src/e2e/enum/Currency.ts`** — add `Currency` entry
2. **`libs/ledger-live-common/src/e2e/enum/Account.ts`** — add `Account` or `TokenAccount` entries (always at least `_1` and `_2`)
3. **Spec file** — add entry to the appropriate spec or create a new one
4. **Rebuild** — `pnpm --filter @ledgerhq/live-common build`

Without the rebuild, new static fields will be `undefined` at runtime, causing `TypeError: Cannot read properties of undefined (reading 'currency')`.

---

## Interactive Setup

For guided environment setup (checks Docker, env vars, builds app, runs smoke test):

```
/e2e-mobile-onboard
```

---

## Common Issues

- **New enum entry is `undefined` at runtime**: rebuild `live-common` — see "Adding a New Currency" above.
- **`.DS_Store` in coin-apps**: `find $COINAPPS -name ".DS_Store" -type f -delete`
- **Speculos version mismatch**: `cd $COINAPPS && git pull origin master`
- **Stale Speculos containers**: `docker rm -f $(docker ps -a --filter name=speculos -q)`
- **Android debug config broken locally**: use `android.emu.release` instead of `android.emu.debug`
- **OOM during build**: prefix with `NODE_OPTIONS="--max-old-space-size=10240"`
