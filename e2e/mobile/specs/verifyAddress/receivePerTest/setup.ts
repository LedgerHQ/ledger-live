import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";

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

export async function initReceiveApp() {
  await app.init(RECEIVE_INIT_OPTIONS);
  await app.mainNavigation.waitForWallet40Ready();
}

// No portfolio deeplink: init already leaves the app there, and the deeplink closed the sheet
// the next step went looking for (QAA-1476).
export async function openReceiveDrawer() {
  await app.portfolio.pressQuickActionTransferButton();
  await app.portfolio.pressTransferBottomSheetReceiveButton();
}
