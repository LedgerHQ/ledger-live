import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { resetLoanState } from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { swapSetup } from "../../bridge/server";
import { FF_BORROW_ENABLED } from "../../utils/featureFlagUtils";
import { NANO_APP_CATALOG_PATH } from "../../utils/constants";

import type { ApplicationOptions } from "page";

export const openLoanAccount = Account.ETH_4;

export const borrowOnChainInitOptions = (): ApplicationOptions => ({
  userdata: "skip-onboarding-with-last-seen-device",
  speculosApp: openLoanAccount.currency.speculosApp,
  featureFlags: FF_BORROW_ENABLED,
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
  await app.init(options);
  await app.mainNavigation.openPortfolioViaDeeplink();
  await swapSetup();
}

export async function resetLoanStateBestEffort(context: string): Promise<void> {
  try {
    await resetLoanState({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
  } catch (error) {
    console.warn(`[borrow] ${context} resetLoanState failed (non-fatal):`, error);
  }
}
