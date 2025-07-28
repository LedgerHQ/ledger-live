import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";
import { swapSetup, waitSwapReady } from "../../bridge/server";
import { setEnv } from "@ledgerhq/live-env";
import { performSwapUntilQuoteSelectionStep } from "../../utils/swapUtils";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const beforeAllFunction = async (swap: SwapType) => {
  await app.speculos.setExchangeDependencies(swap);
  await app.init({
    speculosApp: AppInfos.EXCHANGE,
    featureFlags: {
      ptxSwapLiveAppMobile: {
        enabled: true,
        params: {
          manifest_id:
            process.env.PRODUCTION === "true" ? "swap-live-app-demo-3" : "swap-live-app-demo-3-stg",
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
    cliCommandsOnApp: [
      {
        app: swap.accountToDebit.currency.speculosApp,
        cmd: (userdataPath?: string) => {
          return CLI.liveData({
            currency: swap.accountToDebit.currency.speculosApp.name,
            index: swap.accountToDebit.index,
            add: true,
            appjson: userdataPath,
          });
        },
      },
      {
        app: swap.accountToCredit.currency.speculosApp,
        cmd: (userdataPath?: string) => {
          return CLI.liveData({
            currency: swap.accountToCredit.currency.speculosApp.name,
            index: swap.accountToCredit.index,
            add: true,
            appjson: userdataPath,
          });
        },
      },
    ],
  });
  await app.portfolio.waitForPortfolioPageToLoad();
  const readyPromise = waitSwapReady();
  await app.swap.openViaDeeplink();
  await swapSetup();
  await readyPromise;
};

export function runSwapTest(swap: SwapType, tmsLinks: string[], tags: string[]) {
  describe("Swap - Accepted (without tx broadcast)", () => {
    beforeAll(async () => {
      await beforeAllFunction(swap);
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Swap ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(
        swap.accountToDebit,
        swap.accountToCredit,
      );
      const swapAmount =
        swap.accountToDebit.currency.name === Account.XRP_1.currency.name
          ? parseFloat(Number(minAmount).toFixed(6)).toString()
          : minAmount;

      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        swapAmount,
      );

      const { providerName } = await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.checkExchangeButtonHasProviderName(providerName);
      await app.swapLiveApp.tapExecuteSwap();
      await app.common.selectKnownDevice();

      await app.swap.verifyAmountsAndAcceptSwap(swap, swapAmount);
      await app.swap.verifyDeviceActionLoadingNotVisible();
      await app.swap.waitForSuccessAndContinue();
    });
  });
}
