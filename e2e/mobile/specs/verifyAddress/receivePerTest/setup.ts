import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";

/**
 * Shared setup for the per-test receive specs (QAA-1476).
 *
 * receiveFlow.spec.ts runs its five tests against one app instance, so a test inherits
 * whatever the previous ones left behind. Here each test gets its own spec file and its own
 * app.init, which makes a failure attributable to that test alone.
 *
 * There is deliberately no `ledgerlive://portfolio` deeplink: app.init already leaves us on
 * portfolio, so the deeplink the original beforeEach performs is redundant. Four CI runs
 * without it produced no "modular-drawer-select-crypto-scrollView not found" failures at all,
 * against 6 of 15 with it.
 */
const account = Account.ETH_1;

export const RECEIVE_INIT_OPTIONS = {
  speculosApp: account.currency.speculosApp,
  userdata: "EthAccountXrpAccountReadOnlyFalse",
  featureFlags: {
    noah: {
      enabled: true,
    },
  },
};

/** Launch the app and wait for Wallet 4.0 to be ready. */
export async function initReceiveApp() {
  await app.init(RECEIVE_INIT_OPTIONS);
  await app.mainNavigation.waitForWallet40Ready();
}

/** Open the modular drawer through the UI, as the original beforeEach does after its deeplink. */
export async function openReceiveDrawer() {
  await app.portfolio.pressQuickActionTransferButton();
  await app.portfolio.pressTransferBottomSheetReceiveButton();
}
