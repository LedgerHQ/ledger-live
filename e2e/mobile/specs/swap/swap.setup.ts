import { swapSetup } from "@e2e/bridge/server";
import { ApplicationOptions } from "@e2e/page/index";
import type { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import type { TestMetaOptions } from "@e2e/models/testOptions";

export type SwapAccountsTestOptions = TestMetaOptions & {
  fromAccount: Account;
  toAccount: Account;
};

export async function beforeAllFunctionSwap(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
    featureFlags: {
      ptxSwapLiveAppMobile: {
        enabled: true,
        params: {
          manifest_id:
            process.env.PRODUCTION === "true" ? "swap-live-app-aws" : "swap-live-app-stg-aws",
        },
      },
    },
    cliCommandsOnApp: options.cliCommandsOnApp,
  });
  await app.mainNavigation.waitForWallet40Ready();
  await swapSetup();
  await app.swap.openViaDeeplink();
  await app.swapLiveApp.expectSwapLiveApp();
}
