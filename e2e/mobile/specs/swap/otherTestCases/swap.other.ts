import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { swapSetup, waitSwapReady } from "../../../bridge/server";
import { SwapType } from "@ledgerhq/live-common/lib/e2e/models/Swap";
import { performSwapUntilQuoteSelectionStep } from "../../../utils/swapUtils";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { ApplicationOptions } from "page";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { setEnv } from "@ledgerhq/live-env";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

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
      await app.addAccount.addAccountAtIndex(`${asset.currency.name} 1`, asset.currency.id, 0);
      await app.common.selectFirstAccount();
    }
  };

  describe("Swap a coin for which you have no account yet", () => {
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
    it(`${testTitle}`, async () => {
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
  errorMessage: string | null,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap - Using different seed", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunction({
        userdata: userData,
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Swap using a different seed - ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(
        swap.accountToDebit,
        swap.accountToCredit,
      );
      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        minAmount,
      );
      const provider = await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.checkExchangeButtonHasProviderName(provider.uiName);
      await app.swapLiveApp.tapExecuteSwap();
      await app.common.selectKnownDevice();
      if (errorMessage) {
        await app.swapLiveApp.checkErrorMessage(errorMessage);
      } else {
        await app.swap.verifyAmountsAndAcceptSwapForDifferentSeed(swap, minAmount, errorMessage);
        await app.swap.verifyDeviceActionLoadingNotVisible();
        await app.swap.waitForSuccessAndContinue();
      }
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
    test("Swap landing page", async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        minAmount,
      );
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
    it(`Swap too low quote amounts from ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name} - ${errorMessage}`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(
        swap.accountToDebit,
        swap.accountToCredit,
      );

      const actualAmount = swap.amount === "USE_MIN_AMOUNT" ? minAmount : swap.amount;

      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        actualAmount,
        quotesVisible,
      );
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
    it(`User refuses transaction - ${fromAccount.currency.name} to ${toAccount.currency.name}`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount);
      const rejectedSwap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(
        rejectedSwap.accountToDebit,
        rejectedSwap.accountToCredit,
        minAmount,
      );
      await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.tapExecuteSwap();
      await app.common.disableSynchronizationForiOS();
      await app.common.selectKnownDevice();
      await app.swap.verifyAmountsAndRejectSwap(rejectedSwap, minAmount);
      await app.swap.verifyDeviceActionLoadingNotVisible();
      await app.swapLiveApp.checkErrorMessage("Please retry or contact Ledger Support if in doubt");
    });
  });
}

export function runSwapHistoryOperationsTest(
  swap: SwapType,
  provider: Provider,
  swapId: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap history", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunction({
        userdata: "speculos-tests-app",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Swap history operations - ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`, async () => {
      await app.swap.goToSwapHistory();
      await app.swap.checkSwapOperation(swapId, swap);
      await app.swap.openSelectedOperation(swapId);
      await app.swap.expectSwapDrawerInfos(swapId, swap, provider);
    });
  });
}

export function runExportSwapHistoryOperationsTest(
  swap: SwapType,
  provider: Provider,
  swapId: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap history", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunction({
        userdata: "speculos-tests-app",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Export swap history operations - ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`, async () => {
      await app.swap.goToSwapHistory();
      await app.swap.clickExportOperations();
      await app.swap.checkExportedFileContents(swap, provider, swapId);
    });
  });
}

export function runSwapWithSendMaxTest(
  fromAccount: Account,
  toAccount: Account,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap - Send Max", () => {
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
    it(`Swap max amount from ${fromAccount.currency.name} to ${toAccount.currency.name}`, async () => {
      await app.swapLiveApp.tapFromCurrency();
      await app.common.performSearch(fromAccount.currency.name);
      await app.stake.selectCurrency(fromAccount.currency.id);
      await app.common.selectFirstAccount();
      await app.swapLiveApp.tapToCurrency();
      await app.common.performSearch(toAccount.currency.name);
      await app.stake.selectCurrency(toAccount.currency.id);
      await app.common.selectFirstAccount();
      await app.swapLiveApp.clickSwapMax();
      const amountToSend = await app.swapLiveApp.getAmountToSend();

      await app.swapLiveApp.tapGetQuotesButton();
      await app.swapLiveApp.waitForQuotes();

      await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.tapExecuteSwap();
      await app.common.disableSynchronizationForiOS();

      const swap = new Swap(fromAccount, toAccount, amountToSend);
      await app.common.selectKnownDevice();
      await app.common.enableSynchronization();
      await app.swap.verifyAmountsAndAcceptSwap(swap, amountToSend);
      await app.swap.verifyDeviceActionLoadingNotVisible();
      await app.swap.waitForSuccessAndContinue();
    });
  });
}

export function runSwapSwitchSendAndReceiveCurrenciesTest(
  swap: SwapType,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap - Switch You send and You receive currency", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunction({
        userdata: "speculos-tests-app",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("Switch You send and You receive currency", async () => {
      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        swap.amount,
        false,
      );
      await app.swapLiveApp.switchYouSendAndYouReceive();
      await app.swapLiveApp.checkAssetFrom(swap.accountToCredit.currency.ticker, "");
      await app.swapLiveApp.checkAssetTo(swap.accountToDebit.currency.ticker, "-");
    });
  });
}

export function runSwapCheckProvider(
  fromAccount: Account,
  toAccount: Account,
  provider: Provider,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap - Provider redirection", () => {
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
    it(`Swap test provider redirection (${provider.uiName})`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        minAmount,
        true,
      );

      await app.swapLiveApp.selectSpecificProvider(provider.uiName);
      await app.swapLiveApp.goToProviderLiveApp(provider.uiName);
      await app.swapLiveApp.verifyLiveAppTitle(provider.uiName.toLowerCase());
    });
  });
}

export function runSwapEntryPoints(account: Account, tmsLinks: string[], tags: string[]) {
  const handleSwapPageFlow = async (account: Account) => {
    await app.swapLiveApp.expectSwapLiveApp();
    await app.swapLiveApp.checkAssetFrom(account.currency.ticker, "");
  };

  describe("Swap - Entry Points", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "speculos-tests-app",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("Access Swap from different entry points", async () => {
      await app.portfolio.openViaDeeplink();
      await app.transferMenuDrawer.open();
      let readyPromise = waitSwapReady();
      await app.transferMenuDrawer.navigateToSwap();
      await readyPromise;
      await handleSwapPageFlow(account);

      await app.account.openViaDeeplink();
      readyPromise = waitSwapReady();
      await app.account.goToAccountByName(account.accountName);
      await app.account.tapSwap();
      await readyPromise;
      await handleSwapPageFlow(account);

      await app.portfolio.openViaDeeplink();
      await app.portfolio.goToSpecificAsset(account.currency.name);
      readyPromise = waitSwapReady();
      await app.assetAccountsPage.tapOnAssetQuickActionButton("swap");
      await readyPromise;
      await handleSwapPageFlow(account);
    });
  });
}

export function runSwapNetworkFeesAboveAccountBalanceTest(
  swap: SwapType,
  errorMessage: string | RegExp,
  tmsLinks: string[],
  tags: string[],
) {
  describe(`Swap - Error message when network fees are above account balance (${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name})`, () => {
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
    it(`Swap - Network fees above account balance`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(
        swap.accountToDebit,
        swap.accountToCredit,
      );

      const actualAmount = swap.amount === "USE_MIN_AMOUNT" ? minAmount : swap.amount;

      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        actualAmount,
      );
      await app.swapLiveApp.checkQuotes();
      await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.tapQuoteInfosFeesSelector(1);
      await app.swapLiveApp.tapFeeContainer("fast");
      await app.swapLiveApp.verifySwapAmountErrorMessageIsCorrect(errorMessage);
    });
  });
}
