---
name: e2e
description: Add E2E tests for new coins or update existing Playwright tests for ledger-live-desktop. Use when the user wants to add send/receive e2e tests for a new cryptocurrency, update test configurations, or work with Speculos device simulator.
---

# E2E Desktop Testing Agent

This agent guides you through adding or updating E2E tests for ledger-live-desktop using Playwright and Speculos.

## When to Use

- Adding send/receive e2e tests for a new coin
- Updating existing test configurations
- Working with Speculos device simulator
- Troubleshooting e2e test issues

---

## Project Structure

- `e2e/desktop/tests/specs/` — test scenarios (`.spec.ts`)
- `e2e/desktop/tests/page/` — Page Objects with reusable actions
- `e2e/desktop/tests/utils/` — CLI utilities, Speculos helpers
- `libs/ledger-live-common/src/e2e/` — shared e2e enums and families

---

## Environment Setup

Before running tests, ensure these environment variables are set:

```bash
export COINAPPS=/path/to/coin-apps
export SEED="your 24 words seed phrase here"
export SPECULOS_IMAGE_TAG=ghcr.io/ledgerhq/speculos:latest
# SPECULOS_DEVICE valid values: nanoS, nanoSP, nanoX, stax, flex, nanoGen5
export SPECULOS_DEVICE=nanoSP
export MOCK=0
```

---

## Adding New Coin E2E Test

When the user wants to add e2e tests for a new coin, follow these steps and **ask for required information at each step**:

### Step 1: Add Network enum

**File:** `libs/ledger-live-common/src/e2e/enum/Network.ts`

```typescript
NEWCOIN = "NewCoin",
```

### Step 2: Add AppInfos

**File:** `libs/ledger-live-common/src/e2e/enum/AppInfos.ts`

```typescript
static readonly NEWCOIN = new AppInfos("NewCoin");
```

### Step 3: Add Currency

**File:** `libs/ledger-live-common/src/e2e/enum/Currency.ts`

**Ask user for:** name, ticker, currency_id

```typescript
static readonly NEWCOIN = new Currency("NewCoin", "TICKER", "currency_id", AppInfos.NEWCOIN, [Network.NEWCOIN]);
```

### Step 4: Add Accounts

**File:** `libs/ledger-live-common/src/e2e/enum/Account.ts`

**Ask user for:** account derivation path (BIP44)

```typescript
static readonly NEWCOIN_1 = new Account(Currency.NEWCOIN, "NewCoin 1", 0, "44'/xxx'/0'/0/0");
static readonly NEWCOIN_2 = new Account(Currency.NEWCOIN, "NewCoin 2", 1, "44'/xxx'/0'/0/1");
```

### Step 5: Add family file (if new family)

**File:** `libs/ledger-live-common/src/e2e/families/newcoin.ts`

**Ask user:** "Does this coin belong to an existing family (evm, bitcoin, cosmos...)?"

- If YES → reuse existing family file
- If NO → create new file with device button/screen steps for signing

```typescript
import { Transaction } from "../models/Transaction";
import { getSendEvents, containsSubstringInEvent } from "../speculos";
// implement sendNewCoin function
```

### Step 6: Add to speculos.ts

**File:** `libs/ledger-live-common/src/e2e/speculos.ts`

**6a. Add to `specs` object:**

```typescript
Newcoin: {
  currency: getCryptoCurrencyById("newcoin"),
  appQuery: {
    model: getSpeculosModel(),
    appName: "Newcoin",
  },
  dependencies: [],
},
```

**6b. Add to `signSendTransaction` switch:**

```typescript
case Currency.NEWCOIN.id:
  await sendNewCoin(tx);
  break;
```

### Step 7: Add test case to spec

**File:** `e2e/desktop/tests/specs/send.tx.spec.ts`

**Ask user for:** valid unique xray ticket number

```typescript
{
  transaction: new Transaction(Account.NEWCOIN_1, Account.NEWCOIN_2, "0.001"),
  xrayTicket: "B2CQA-XXXX",
},
```

### Step 8: Rebuild dependencies

```bash
pnpm build:lld:deps
```

### Step 9: Test on all devices

**REQUIRED:** Run the test on all supported device models before considering it complete:

| Device | Model ID   | Description        |
| ------ | ---------- | ------------------ |
| LNS    | `nanoS`    | Ledger Nano S      |
| LNSP   | `nanoSP`   | Ledger Nano S Plus |
| LNX    | `nanoX`    | Ledger Nano X      |
| STAX   | `stax`     | Ledger Stax        |
| FLEX   | `flex`     | Ledger Flex        |
| NG5    | `nanoGen5` | Ledger NG5         |

Run tests for each device using the `SPECULOS_MODEL` environment variable:

```bash
SPECULOS_MODEL=nanoS DISABLE_TRANSACTION_BROADCAST=1 pnpm test:desktop e2e:playwright specs/folder/file.spec.ts
SPECULOS_MODEL=nanoSP DISABLE_TRANSACTION_BROADCAST=1 pnpm test:desktop e2e:playwright specs/folder/file.spec.ts
SPECULOS_MODEL=nanoX DISABLE_TRANSACTION_BROADCAST=1 pnpm test:desktop e2e:playwright specs/folder/file.spec.ts
SPECULOS_MODEL=stax DISABLE_TRANSACTION_BROADCAST=1 pnpm test:desktop e2e:playwright specs/folder/file.spec.ts
SPECULOS_MODEL=flex DISABLE_TRANSACTION_BROADCAST=1 pnpm test:desktop e2e:playwright specs/folder/file.spec.ts
SPECULOS_MODEL=nanoGen5 DISABLE_TRANSACTION_BROADCAST=1 pnpm test:desktop e2e:playwright specs/folder/file.spec.ts
```

**Note:** Each device may have different button layouts and screen flows. Ensure the family file handles device-specific interactions correctly.

---

## Test Configuration Reference

```typescript
test.use({
  userdata: "skip-onboarding",
  speculosApp: transaction.accountToDebit.currency.speculosApp,
  cliCommands: [liveDataWithRecipientAddressCommand(transaction)],
});
```

- **Userdata:** `skip-onboarding`, `1AccountBTC1AccountETH`
- **Speculos:** `Account.currency.speculosApp`
- **CLI commands:** `liveDataCommand`, `liveDataWithAddressCommand`, `liveDataWithRecipientAddressCommand`

---

## Commands

- **Install:** `pnpm i`
- **Build deps:** `pnpm build:lld:deps`
- **Build testing:** `pnpm desktop build:testing`
- **Run test:** `DISABLE_TRANSACTION_BROADCAST=1 pnpm e2e:desktop test:playwright specs/folder/file.spec.ts`
- **Debug:** `PWDEBUG=1 DISABLE_TRANSACTION_BROADCAST=1 pnpm e2e:desktop test:playwright specs/folder/file.spec.ts`

---

## Best Practices

- **Never use hardcoded timeouts** (e.g., `page.waitForTimeout(1000)`)
- Use `@step` decorator in Page Objects
- Access methods via `app` fixture (e.g., `app.layout`, `app.send`, `app.speculos`)
- **MANDATORY:** Test on all 6 device models (LNS, LNSP, LNX, STAX, FLEX, NG5) before marking tests complete
