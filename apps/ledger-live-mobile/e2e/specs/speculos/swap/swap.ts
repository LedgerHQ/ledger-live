import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { swapSetup } from "../../../bridge/server";
import { setEnv } from "@ledgerhq/live-env";

const app_exchange: AppInfos = AppInfos.EXCHANGE;
setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const beforeAllFunction = async (swap: Swap) => {
  setExchangeDependencies(
    [swap.accountToDebit, swap.accountToCredit].map(acc => ({
      name: acc.currency.speculosApp.name.replace(/ /g, "_"),
    })),
  );
  await app.init({
    speculosApp: app_exchange,
    featureFlags: {
      ptxSwapLiveAppMobile: {
        enabled: true,
        params: {
          manifest_id: "swap-live-app-demo-3-stg",
        },
      },
    },
    cliCommandsOnApp: [
      {
        nanoApp: swap.accountToDebit.currency.speculosApp,
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
        nanoApp: swap.accountToCredit.currency.speculosApp,
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
  swapSetup();
  await app.portfolio.waitForPortfolioPageToLoad();
};

async function performSwapUntilQuoteSelectionStep(swap: Swap) {
  await app.swapLiveApp.waitForSwapLiveApp();

  await app.swapLiveApp.tapFromCurrency();
  await app.common.performSearch(swap.accountToDebit.currency.name);
  await app.addAccount.selectCurrency(swap.accountToDebit.currency.id);
  await app.common.selectFirstAccount();
  await app.swapLiveApp.tapToCurrency();
  await app.common.performSearch(swap.accountToCredit.currency.name);
  await app.addAccount.selectCurrency(swap.accountToCredit.currency.id);
  await app.common.selectFirstAccount();
  await app.swapLiveApp.inputAmount(swap.amount);
  await app.swapLiveApp.tapGetQuotesButton();
  await app.swapLiveApp.waitForQuotes();
}

export async function runSwapTest(swap: Swap, tmsLinks: string[]) {
  describe("Swap - Accepted (without tx broadcast)", () => {
    beforeAll(async () => {
      await beforeAllFunction(swap);
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    it(`Swap ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`, async () => {
      await app.swap.openViaDeeplink();
      await performSwapUntilQuoteSelectionStep(swap);
      await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.tapExecuteSwap();
      await app.common.selectKnownDevice();

      await app.swap.waitForDeviceConfirmDrawer();
      await app.speculos.verifyAmountsAndAcceptSwap(swap);
      await app.swap.waitForEmptyHistory(); // TODO: remove this line when the history is fixed
    });
  });
}
