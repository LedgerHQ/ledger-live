import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { swapSetup, waitSwapReady } from "../../bridge/server";
import { ApplicationOptions } from "page";
import { ABTestingVariants } from "@ledgerhq/types-live";

export const liveDataCommand =
  (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
    CLI.liveData({
      currency: currencyApp.name,
      index,
      add: true,
      appjson: userdataPath,
    });

export const liveDataWithAddressCommand = (account: Account) => async (userdataPath?: string) => {
  await CLI.liveData({
    currency: account.currency.speculosApp.name,
    index: account.index,
    add: true,
    appjson: userdataPath,
  });

  const { address } = await CLI.getAddress({
    currency: account.currency.speculosApp.name,
    path: account.accountPath,
    derivationMode: account.derivationMode,
  });

  account.address = address;
  if (account.parentAccount) {
    account.parentAccount.address = address;
  }

  return address;
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
      llmAnalyticsOptInPrompt: {
        enabled: true,
        params: {
          variant: ABTestingVariants.variantA,
          entryPoints: [],
        },
      },
    },
    cliCommandsOnApp: options.cliCommandsOnApp,
  });
  await app.portfolio.waitForPortfolioPageToLoad();
  await swapSetup();
  const readyPromise = waitSwapReady();
  await app.swap.openViaDeeplink();
  await readyPromise;
}
