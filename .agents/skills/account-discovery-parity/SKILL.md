---
name: account-discovery-parity
description: Compare persisted app.json accounts between legacy CurrencyBridge#scanAccounts and account-discovery on a real device, one representative coin per family. Use when verifying account-discovery parity.
---

# Account Discovery Parity

Compare accounts produced by legacy `CurrencyBridge#scanAccounts` (Add Account drawer) against the new `account-discovery` devtool (`/devtools` → `account-discovery`) on a real device.

## Setup

Use two isolated config dirs seeded from `apps/ledger-live-desktop/tests/userdata/skip-onboarding.json` (never touch the user's real `Ledger Live` app data):

```bash
DEV_TOOLS=1 LEDGER_CONFIG_DIRECTORY=<dir> ELECTRON_ARGS=--remote-debugging-port=8315 pnpm dev:lld
```

Drive the Electron renderer over CDP (`localhost:8315`) with Playwright. Apps install on the fly during scans; use `#/manager` → Apps installed → Uninstall all only when device storage is full.

## Per-family loop

Test one representative coin per family, plus known special cases (e.g. `aleo`, `assethub_polkadot`):

1. **Legacy**: Add Account → search coin → enable "Show all address types" → select all accounts (including empty ones) → Confirm.
2. **New**: `/devtools` → `account-discovery` → select coin → Scan → select all rows → Complete selected (if enabled) → Add.
   *(Alternate `legacy → new` and `new → legacy` between coins to avoid extra app restarts.)*
3. **Diff `app.json`**: compare every account field (`id`, `seedIdentifier`, `xpub`, `freshAddress`, `freshAddressPath`, `derivationMode`, `index`, `used`, `name`, `balance`, `spendableBalance`, `operations`, `subAccounts`, family resources, and `wallet` slice). Ignore only time-dependent fields (`blockHeight`, `creationDate`, `lastSyncDate`, `balanceHistoryCache`, live staking rewards, and `bitcoinResources` list order).
4. **Fix & re-verify**: trace any semantic diff, fix + unit test, rebuild `@ledgerhq/live-common`, re-run the coin on `new`, confirm 0 semantic diffs, and commit to the PR.
