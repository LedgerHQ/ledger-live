import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { swapSetup } from "../../bridge/server";
import { ensureBridgeReady } from "../../helpers/commonHelpers";
import { FF_BORROW_E2E } from "../../utils/featureFlagUtils";

import type { ApplicationOptions } from "page";

export const openLoanAccount = Account.ETH_4;

export const borrowOnChainInitOptions = (): ApplicationOptions => ({
  userdata: "skip-onboarding-with-last-seen-device",
  speculosApp: openLoanAccount.currency.speculosApp,
  featureFlags: FF_BORROW_E2E,
  cliCommandsOnApp: [
    {
      app: openLoanAccount.currency.speculosApp,
      cmd: liveDataWithAddressCommand(openLoanAccount),
    },
  ],
  speculosForSetupOnly: true,
  recycleSpeculosAfterCliOnApp: true,
});

export async function beforeAllFunctionBorrow(options: ApplicationOptions) {
  await ensureBridgeReady();
  await app.init(options);
  await app.mainNavigation.openPortfolioViaDeeplink();
  await swapSetup();
}
