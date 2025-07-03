import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { setupEnv } from "../../../utils/swapUtils";
import { swapSetup, waitSwapReady } from "../../../bridge/server";
import { SwapType } from "@ledgerhq/live-common/lib/e2e/models/Swap";
import {
  performSwapUntilQuoteSelectionStep,
  checkSwapInfosOnDeviceVerificationStep,
} from "../../../utils/swapUtils";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { ApplicationOptions } from "page";

const liveDataCommand = (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
  CLI.liveData({
    currency: currencyApp.name,
    index,
    add: true,
    appjson: userdataPath,
  });

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
    cliCommandsOnApp: options.cliCommandsOnApp,
  });
  await app.portfolio.waitForPortfolioPageToLoad();
  const readyPromise = waitSwapReady();
  await app.swap.openViaDeeplink();
  await swapSetup();
  await readyPromise;
}

export function runSwapWithoutAccountTest(
  asset1: Account,
  asset2: Account,
  testTitle: string,
  tmsLinks: string[],
  event: "noAccountTo" | "noAccountFrom" | "noAccountFromAndTo",
  tags: string[],
) {
  const handleAssetSwap = async (asset: Account, hasAccount: boolean) => {
    await app.common.performSearch(asset.currency.name);
    await app.stake.selectCurrency(asset.currency.id);
    if (hasAccount) {
      await app.common.selectFirstAccount();
    } else {
      await app.common.tapProceedButton();
      await app.addAccount.addAccountAtIndex(asset.currency.name, asset.currency.id, 0);
      await app.common.selectFirstAccount();
    }
  };

  describe("Swap a coin for which you have no account yet", () => {
    setupEnv(true);

    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: asset2.currency.speculosApp,
        cliCommandsOnApp:
          event !== "noAccountFromAndTo"
            ? [
                {
                  app: asset1.currency.speculosApp,
                  cmd: liveDataCommand(asset1.currency.speculosApp, asset1.index),
                },
              ]
            : [],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${testTitle} - LLM`, async () => {
      const debitAsset = event === "noAccountFrom" ? asset2 : asset1;
      const creditAsset = event === "noAccountFrom" ? asset1 : asset2;

      await app.swapLiveApp.tapFromCurrency();
      await handleAssetSwap(debitAsset, event === "noAccountTo");
      await app.swapLiveApp.tapToCurrency();
      await handleAssetSwap(creditAsset, event === "noAccountFrom");
      await app.swapLiveApp.expectSwapLiveApp();
    });
  });
}

export function runSwapWithDifferentSeedTest(
  swap: SwapType,
  userData: string,
  errorMessage: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap - Using different seed", () => {
    setupEnv(true);

    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunction({
        userdata: userData,
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Swap using a different seed - ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name} - LLM`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(
        swap.accountToDebit,
        swap.accountToCredit,
      );
      await performSwapUntilQuoteSelectionStep(swap, minAmount);

      await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.tapExecuteSwap();
      await app.common.selectKnownDevice();
      await app.swapLiveApp.checkErrorMessage(errorMessage);
    });
  });
}

export function runSwapLandingPageTest(
  fromAccount: Account,
  toAccount: Account,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap - Landing page", () => {
    setupEnv(true);

    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(fromAccount, toAccount);
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: AppInfos.EXCHANGE,
        cliCommandsOnApp: [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataCommand(fromAccount.currency.speculosApp, fromAccount.index),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataCommand(toAccount.currency.speculosApp, toAccount.index),
          },
        ],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test("Swap landing page - LLM", async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(swap, minAmount);
      const providerList = await app.swapLiveApp.getProviderList();
      await app.swapLiveApp.checkFirstQuoteContainerInfos(providerList);
      await app.swapLiveApp.checkBestOffer();
    });
  });
}

export function runTooLowAmountForQuoteSwapsTest(
  swap: SwapType,
  tmsLinks: string[],
  errorMessage: string | RegExp,
  ctaBanner: boolean,
  quotesVisible: boolean,
  tags: string[],
) {
  describe("Swap - with too low amount (throwing UI errors)", () => {
    setupEnv(true);

    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: AppInfos.EXCHANGE,
        cliCommandsOnApp: [
          {
            app: swap.accountToDebit.currency.speculosApp,
            cmd: liveDataCommand(
              swap.accountToDebit.currency.speculosApp,
              swap.accountToDebit.index,
            ),
          },
          {
            app: swap.accountToCredit.currency.speculosApp,
            cmd: liveDataCommand(
              swap.accountToCredit.currency.speculosApp,
              swap.accountToCredit.index,
            ),
          },
        ],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Swap too low quote amounts from ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name} - ${errorMessage} - LLM`, async () => {
      await performSwapUntilQuoteSelectionStep(swap, swap.amount, quotesVisible);
      if (quotesVisible) {
        await app.swapLiveApp.checkQuotes();
        await app.swapLiveApp.selectExchange();
      }
      await app.swapLiveApp.verifySwapAmountErrorMessageIsCorrect(errorMessage);

      if (ctaBanner) {
        await app.swapLiveApp.checkCtaBanner();
      }
    });
  });
}

export function runUserRefusesTransactionTest(
  fromAccount: Account,
  toAccount: Account,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap - Rejected on device", () => {
    setupEnv(true);

    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(fromAccount, toAccount);
      await beforeAllFunction({
        speculosApp: AppInfos.EXCHANGE,
        cliCommandsOnApp: [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataCommand(fromAccount.currency.speculosApp, fromAccount.index),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataCommand(toAccount.currency.speculosApp, toAccount.index),
          },
        ],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`User refuses transaction - ${fromAccount.currency.name} to ${toAccount.currency.name} - LLM`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount);
      const rejectedSwap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(rejectedSwap, minAmount);
      const selectedProvider: string = await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.tapExecuteSwap();
      await app.common.selectKnownDevice();

      await checkSwapInfosOnDeviceVerificationStep(rejectedSwap, selectedProvider, minAmount);
      await app.swap.verifyAmountsAndRejectSwap(rejectedSwap, minAmount);
      await app.swapLiveApp.checkErrorMessage("User refused");
    });
  });
}
