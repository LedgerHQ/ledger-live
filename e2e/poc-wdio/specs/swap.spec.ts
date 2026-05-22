import pages from "../pages/pages.ts";
import { swapSetup } from "../bridge/server.ts";

import { setEnv } from "@ledgerhq/live-env";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { ABTestingVariants } from "@ledgerhq/types-live";

import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

describe("Swap", () => {
  it("ETH to USDT (without broadcast)", async () => {
    const swap = new Swap(
      TokenAccount.ETH_USDC_1,
      Account.BTC_NATIVE_SEGWIT_1,
      "65",
      undefined,
      Fee.MEDIUM,
    );

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

    await pages.portfolio.waitForPageToLoad();
    await swapSetup();
    await pages.swap.openDeeplink();
    await pages.swapLiveApp.expectLiveApp();

    //TODO: execute swap flow and assertions
  });
});
