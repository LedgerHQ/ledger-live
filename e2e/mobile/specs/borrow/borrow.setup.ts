import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { device } from "detox";
import { swapSetup } from "../../bridge/server";
import { ensureBridgeReady, isAndroid, launchApp } from "../../helpers/commonHelpers";
import { BORROW_FEATURE_FLAGS } from "./borrow.constants";

import type { ApplicationOptions } from "page";

export const openLoanAccount = Account.ETH_4;

export const borrowOnChainInitOptions = (): ApplicationOptions => ({
  userdata: "skip-onboarding-with-last-seen-device",
  speculosApp: openLoanAccount.currency.speculosApp,
  featureFlags: BORROW_FEATURE_FLAGS,
  cliCommandsOnApp: [
    {
      app: openLoanAccount.currency.speculosApp,
      cmd: liveDataWithAddressCommand(openLoanAccount),
    },
  ],
  speculosForSetupOnly: true,
  recycleSpeculosAfterCliOnApp: true,
});

export type BorrowBeforeAllOptions = {
  /** Relaunch the app so Wallet 4.0 navigation is reachable after a prior describe left Borrow open. */
  freshInstance?: boolean;
};

async function relaunchAppWithBridge(): Promise<void> {
  const port = await launchApp({ newInstance: true });
  if (isAndroid()) {
    await device.reverseTcpPort(port);
  }
}

export async function beforeAllFunctionBorrow(
  options: ApplicationOptions,
  { freshInstance = false }: BorrowBeforeAllOptions = {},
) {
  if (freshInstance) {
    await relaunchAppWithBridge();
  } else {
    await ensureBridgeReady();
  }
  await app.init(options);
  await app.mainNavigation.openPortfolioViaDeeplink();
  await swapSetup();
}
