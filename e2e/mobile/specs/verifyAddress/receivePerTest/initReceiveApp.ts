import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";

const account = Account.ETH_1;

const RECEIVE_INIT_OPTIONS = {
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
