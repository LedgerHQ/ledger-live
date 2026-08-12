import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";

/**
 * Shared setup for the isolated receive specs (QAA-1476).
 *
 * These specs are a deliberate split of receiveFlow.spec.ts: one test per file, so each
 * one runs against a freshly initialised app instead of inheriting the state of whatever
 * ran before it. That puts every `ledgerlive://portfolio` deeplink right next to the
 * initial account sync, which is the condition we want to measure — captures from the
 * combined spec show bottom sheets (the modular drawer, and also the transfer sheet)
 * sitting at their closed position while the test believed them open.
 */
export const RECEIVE_INIT_OPTIONS = {
  speculosApp: Account.ETH_1.currency.speculosApp,
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

/** Reach the modular drawer the same way the combined spec does. */
export async function openReceiveDrawer() {
  await app.mainNavigation.openPortfolioViaDeeplink();
  await app.portfolio.pressQuickActionTransferButton();
  await app.portfolio.pressTransferBottomSheetReceiveButton();
}
