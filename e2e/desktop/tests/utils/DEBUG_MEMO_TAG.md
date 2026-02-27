# Memo Tag E2E Debug Guide

## Current Failure: "Process failed to launch!"

The test fails because **Electron fails to launch** before Playwright can connect. This is an environment issue, not a locator issue.

### To run the test successfully, ensure:

1. **Display available**: Electron needs a display. On headless Linux/CI, use:
   ```bash
   xvfb-run pnpm e2e:desktop test:playwright memo.tag.spec.ts
   ```
   On macOS, run from a terminal with a display (not SSH without X forwarding).

2. **Ledger Live built**: The main bundle must exist:
   ```bash
   pnpm build:lld
   ```

3. **For MOCK=0 (with Speculos)**: Have Speculos + coin apps:
   ```bash
   MOCK=0 COINAPPS=/path/to/coin-apps pnpm e2e:desktop test:playwright memo.tag.spec.ts
   ```

### If the app launches but the test fails on memo locators:

Run with Playwright Inspector to debug:
```bash
PWDEBUG=1 pnpm e2e:desktop test:playwright memo.tag.spec.ts
```

When it fails, note which step fails:
- `expectStellarMemoVisible` → memo section not found
- `selectStellarMemoType` → dropdown trigger or option not found
- `fillStellarMemoValue` → memo input not found
- `selectMatchedAddressAndProceed` → address selection not found

### Memo locator strategy (memoTag.page.ts):

- **Section**: `stellar-memo-section` or `stellar-memo-dropdown`
- **Trigger**: `getByRole("combobox")` or `[data-testid='stellar-memo-dropdown-trigger']`
- **Options**: `getByRole("option", { name: "No Memo" })` etc.
- **Input**: `send-memo-input` or `stellar-memo-section` + `getByRole("textbox")`
