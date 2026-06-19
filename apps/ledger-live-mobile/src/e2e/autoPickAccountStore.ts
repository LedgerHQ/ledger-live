/**
 * Tiny singleton flag that, when enabled by the e2e bridge, makes the
 * wallet-api `account.request` handler auto-pick the first account matching
 * the requested currency instead of opening the modular drawer.
 *
 * Used by Maestro on iOS where the modular drawer renders as a sheet over
 * the WebView and crashes XCUITest's view-hierarchy snapshot. Detox does NOT
 * enable this — it can drive the drawer natively.
 */

let enabled = false;
let currencyId: string | undefined;

export const autoPickAccountStore = {
  setEnabled(value: boolean, targetCurrencyId?: string) {
    enabled = value;
    currencyId = targetCurrencyId;
  },
  isEnabled(): boolean {
    return enabled;
  },
  getCurrencyId(): string | undefined {
    return currencyId;
  },
};
