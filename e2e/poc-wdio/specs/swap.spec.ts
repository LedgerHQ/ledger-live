import pages from "../pages/pages.ts";
import { swapSetup } from "../bridge/server.ts";
import { performSwapUntilQuoteSelectionStep } from "../flows/swap.flows.ts";

import { setEnv } from "@ledgerhq/live-env";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { ABTestingVariants } from "@ledgerhq/types-live";

import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { verifyAmountsAndAcceptSwap } from "@ledgerhq/live-common/e2e/speculos";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

describe("Swap", () => {
  it("ETH to USDT (without broadcast)", async () => {
    // swap to test
    const swap = new Swap(Account.ETH_1, TokenAccount.ETH_USDT_1, "65", undefined, Fee.MEDIUM);

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
    await swapSetup();
    await pages.swap.openDeeplink();
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
    // await app.swap.verifyAmountsAndAcceptSwap(swap, swapAmount); -> use direct function instead!
    await verifyAmountsAndAcceptSwap(swap, swapAmount);
    await pages.swap.waitForSuccess();
    await pages.common.tapProceed();
  });
});
