import pages from "../pages/pages.ts";
import { swapSetup } from "../bridge/server.ts";
import { performSwapUntilQuoteSelectionStep } from "../flows/swap.flows.ts";

import { setEnv } from "@ledgerhq/live-env";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { ABTestingVariants } from "@ledgerhq/types-live";

import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { verifyAmountsAndAcceptSwap } from "@ledgerhq/live-common/e2e/speculos";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

export const runSwapTest = async (swap: Swap) => {
  // init options
  const options = {
    speculosApp: AppInfos.EXCHANGE,
    cliCommandsOnApp: [
      {
        app: swap.accountToDebit.currency.speculosApp,
        cmd: liveDataWithAddressCommand(swap.accountToDebit),
      },
      {
        app: swap.accountToCredit.currency.speculosApp,
        cmd: liveDataWithAddressCommand(swap.accountToCredit),
      },
    ],
  };

  await pages.speculos.setExchangeDependencies(swap);

  // init
  await pages.init({
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

  // go to swap
  await pages.portfolio.waitForPageToLoad();
  console.log("Portfolio page loaded, forced wait for app sync...");
  await driver.pause(15_000)
  await swapSetup();
  console.log("Opening Swap Live App");
  await pages.swap.openDeeplink();
  await pages.swapLiveApp.switchTo();
  await pages.swapLiveApp.expectLiveApp();

  const minAmount = await pages.swapLiveApp.getMinimumAmount(
    swap.accountToDebit,
    swap.accountToCredit,
  );
  const swapAmount =
    swap.accountToDebit.currency.name === Account.XRP_1.currency.name
      ? parseFloat(Number(minAmount).toFixed(6)).toString()
      : minAmount;

  await performSwapUntilQuoteSelectionStep(swap.accountToDebit, swap.accountToCredit, swapAmount);

  // select provider and run validations
  const provider = await pages.swapLiveApp.selectExchange();
  await pages.swapLiveApp.checkExchangeButtonHasProviderName(provider.uiName);
  // await app.common.disableSynchronizationForiOS(); -> DETOX only
  await pages.swapLiveApp.tapExecuteSwap(provider.uiName);
  await driver.switchAppiumContext("NATIVE_APP");
  // await app.swap.verifyAmountsAndAcceptSwap(swap, swapAmount); -> use direct function instead!
  await verifyAmountsAndAcceptSwap(swap, swapAmount);
  await pages.swap.waitForSuccess();
  await pages.common.tapProceed();
};
