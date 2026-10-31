# Adding or updating a desktop E2E test

This document guides you through adding or updating E2E tests for ledger-live-desktop using Playwright and Speculos.

## When to Use

- Adding send/receive e2e tests for a new coin
- Updating existing test configurations
- Working with Speculos device simulator
- Troubleshooting e2e test issues

---

## Project Structure

- `e2e/desktop/tests/specs/` — test scenarios (`.spec.ts`)
- `e2e/desktop/tests/page/` — Page Objects with reusable actions
- `e2e/desktop/tests/utils/` — desktop test helpers (tags, feature flags, Allure)
- `libs/live-e2e-shared/src/` — shared e2e enums, families, and Speculos helpers

---

## Adding New Coin E2E Test

When the user wants to add e2e tests for a new coin, follow these steps and **ask for required information at each step**:

### Step 1: Add Network enum

[File](/libs/live-e2e-shared/src/enum/Network.ts)

```typescript
NEWCOIN = "NewCoin",
```

### Step 2: Add AppInfos

[File](/libs/live-e2e-shared/src/enum/AppInfos.ts)

```typescript
static readonly NEWCOIN = new AppInfos("NewCoin");
```

### Step 3: Add Currency

[File](/libs/live-e2e-shared/src/enum/Currency.ts)

**Ask user for:** name, ticker, currency_id

```typescript
static readonly NEWCOIN = new Currency("NewCoin", "TICKER", "currency_id", AppInfos.NEWCOIN, [Network.NEWCOIN]);
```

### Step 3b: Set the owning team

[File](/libs/live-e2e-shared/src/data/coinTeamOwner.ts)

Look up the coin module's owner in the CODEOWNERS of the repo that hosts it: this repo's [CODEOWNERS](/CODEOWNERS) for a module under `libs/coin-modules/`, otherwise [`LedgerHQ/coin-modules`](https://github.com/LedgerHQ/coin-modules/blob/main/.github/CODEOWNERS):

```bash
gh api repos/LedgerHQ/coin-modules/contents/.github/CODEOWNERS --jq .content | base64 -d
```

If a BST team owns it (the handles are listed in `coinTeamOwner.ts`), add the currency id to `BST_CURRENCY_IDS`. Otherwise nothing changes, because `coinTeamOwner` returns Coin-integration.

**Ask user** only when no CODEOWNERS line covers the module.

### Step 4: Add Accounts

[File](/libs/live-e2e-shared/src/enum/Account.ts)

**Ask user for:** account derivation path (BIP44)

```typescript
static readonly NEWCOIN_1 = new Account({
  currency: Currency.NEWCOIN,
  accountName: "NewCoin 1",
  index: 0,
  accountPath: "44'/xxx'/0'/0/0",
});
static readonly NEWCOIN_2 = new Account({
  currency: Currency.NEWCOIN,
  accountName: "NewCoin 2",
  index: 1,
  accountPath: "44'/xxx'/0'/0/1",
});
```

### Step 5: Add family file (if new family)

[File](/libs/live-e2e-shared/src/families/newcoin.ts)

**Ask user:** "Does this coin belong to an existing family (evm, bitcoin, cosmos...)?"

- If YES → reuse existing family file
- If NO → create new file with device button/screen steps for signing

```typescript
import { Transaction } from "../models/Transaction";
import { getSendEvents, expectSpeculosEventsContain } from "../speculos";
// implement sendNewCoin function
```

### Step 6: Add to speculos.ts

[File](/libs/live-e2e-shared/src/speculos.ts)

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

### Step 7: Add test case to the New Send Flow spec

[File](../tests/specs/newSendFlow.tx.spec.ts)

**Ask user for:** a valid, unused `B2CQA-XXXX` test id

Append one entry to the existing `nativeSendTransactions` array. Do not redeclare the array, and do
not call `registerNewSendFlowTests` again — the spec already does.

```typescript
{
  transaction: new Transaction(Account.NEWCOIN_1, Account.NEWCOIN_2, "0.001"),
  xrayTicket: "B2CQA-XXXX",
},
```

The tests read the family allow-list from `FF_NEW_SEND_FLOW_ENABLED` in
`tests/utils/featureFlagUtils.ts`. If the new coin's family is not already listed, add its family
id there:

```typescript
families: [
  // ...existing families
  "<family id>",
],
```

That list mirrors the production rollout. A currency whose family is missing, or whose id is in
`excludedCurrencyIds`, must stay in the legacy spec until it is enabled in production.

### Step 8: Rebuild dependencies and the app

```bash
pnpm build:lld:deps
pnpm desktop build:testing
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

Run tests for each device using the `SPECULOS_DEVICE` environment variable:

```bash
SPECULOS_DEVICE=nanoS DISABLE_TRANSACTION_BROADCAST=1 pnpm e2e:desktop test:playwright specs/folder/file.spec.ts
SPECULOS_DEVICE=nanoSP DISABLE_TRANSACTION_BROADCAST=1 pnpm e2e:desktop test:playwright specs/folder/file.spec.ts
SPECULOS_DEVICE=nanoX DISABLE_TRANSACTION_BROADCAST=1 pnpm e2e:desktop test:playwright specs/folder/file.spec.ts
SPECULOS_DEVICE=stax DISABLE_TRANSACTION_BROADCAST=1 pnpm e2e:desktop test:playwright specs/folder/file.spec.ts
SPECULOS_DEVICE=flex DISABLE_TRANSACTION_BROADCAST=1 pnpm e2e:desktop test:playwright specs/folder/file.spec.ts
SPECULOS_DEVICE=nanoGen5 DISABLE_TRANSACTION_BROADCAST=1 pnpm e2e:desktop test:playwright specs/folder/file.spec.ts
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
- **DevTools:** `DEV_TOOLS=1 pnpm e2e:desktop test:playwright specs/folder/file.spec.ts` opens detached DevTools and turns on developer mode and Live App DevTools (the "DevTools" button in the Live App top bar). Set `DEV_TOOLS_MODE` (`right`, `left`, `bottom`, `undocked`) to dock them instead.

---

## Finishing

Follow [validate-before-finishing](../../../docs/validate-before-finishing.md), then:

Dispatch filtered desktop CI (`/run-e2e-ci`) and read Allure, not just the green check. A retry hides a failed first attempt.

Comments follow `/comments`. Keep only those recording a non-obvious reason.
