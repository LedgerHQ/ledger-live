import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Device } from "@ledgerhq/live-common/e2e/enum/Device";
import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";
import { performSwapUntilQuoteSelectionStep } from "../../../utils/swapUtils";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { setEnv } from "@ledgerhq/live-env";
import { beforeAllFunctionSwap } from "../swap.setup";
import { isWallet40 } from "../../../helpers/commonHelpers";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

async function handleAssetSwap(asset: Account, hasAccount: boolean) {
  const isModularDrawer = await app.modularDrawer.isFlowEnabled("live_app");
  if (isModularDrawer) {
    await app.modularDrawer.performSearchByTicker(asset.currency.ticker);
    await app.modularDrawer.selectCurrencyByTicker(asset.currency.ticker);
    const networkName = asset?.parentAccount
      ? asset.parentAccount.currency.name
      : asset.currency.speculosApp.name;
    await app.modularDrawer.selectNetworkIfAsked(networkName);

    if (hasAccount) {
      await app.modularDrawer.selectFirstAccount();
    } else {
      await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
      await app.addAccount.addAccountAtIndex(`${asset.currency.name} 1`, asset.currency.id, 0);
    }
  } else {
    await app.common.performSearch(asset.currency.name);
    await app.stake.selectCurrency(asset.currency.id);
    if (hasAccount) {
      await app.common.selectFirstAccount();
    } else {
      await app.common.tapProceedButton();
      await app.addAccount.addAccountAtIndex(`${asset.currency.name} 1`, asset.currency.id, 0);
      await app.common.selectFirstAccount();
    }
  }
}

export function runSwapWithoutAccountTest(
  asset1: Account,
  asset2: Account,
  testTitle: string,
  tmsLinks: string[],
  event: "noAccountTo" | "noAccountFrom" | "noAccountFromAndTo",
  tags: string[],
) {
  describe("Swap a coin for which you have no account yet", () => {
    beforeAll(async () => {
      await beforeAllFunctionSwap({
        userdata: "skip-onboarding",
        speculosApp: asset2.currency.speculosApp,
        cliCommandsOnApp:
          event !== "noAccountFromAndTo"
            ? [
                {
                  app: asset1.currency.speculosApp,
                  cmd: liveDataCommand(asset1),
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
  addressFrom: string,
  addressTo: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap - Using different seed", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunctionSwap({
        userdata: userData,
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Swap using a different seed - ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`, async () => {
      swap.accountToDebit.address = addressFrom;
      swap.accountToCredit.address = addressTo;
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
      await app.common.disableSynchronizationForiOS();
      await app.swapLiveApp.tapExecuteSwap(provider.uiName);
      if (errorMessage) {
        await app.swapLiveApp.checkErrorMessage(errorMessage);
      } else {
        await app.swap.verifyAmountsAndAcceptSwapForDifferentSeed(swap, minAmount, errorMessage);
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
      await beforeAllFunctionSwap({
        userdata: "skip-onboarding",
        speculosApp: AppInfos.EXCHANGE,
        cliCommandsOnApp: [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(fromAccount),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(toAccount),
          },
        ],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("Swap landing page", async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        minAmount,
      );
      const providerList = await app.swapLiveApp.getProviderList();
      await app.swapLiveApp.checkFirstQuoteContainerInfos(providerList);
      await app.swapLiveApp.checkBestOffer(providerList);

      await app.portfolio.openViaDeeplink();
      await app.swap.openViaDeeplink();
      await app.swapLiveApp.expectSwapLiveAppForm();
      await app.swapLiveApp.checkAssetFromMatchesAccount(fromAccount);
      await app.swapLiveApp.checkAssetToMatchesAccount(toAccount);
    });
  });
}

async function setupSwapAccounts(
  fromAccount: Account,
  toAccount: Account,
  userdata = "skip-onboarding",
) {
  await app.speculos.setExchangeDependencies(fromAccount, toAccount);
  await beforeAllFunctionSwap({
    userdata,
    speculosApp: AppInfos.EXCHANGE,
    cliCommandsOnApp: [
      {
        app: fromAccount.currency.speculosApp,
        cmd: liveDataWithAddressCommand(fromAccount),
      },
      {
        app: toAccount.currency.speculosApp,
        cmd: liveDataWithAddressCommand(toAccount),
      },
    ],
  });
}

export function runSwapLnsNotSupportedBannerTest(
  fromAccount: Account,
  toAccount: Account,
  unsupportedProvider: SwapProvider,
  tmsLinks: string[],
  tags: string[],
) {
  (process.env.SPECULOS_DEVICE === Device.LNS.name ? describe : describe.skip)(
    "Swap - LNS not supported banner",
    () => {
      beforeAll(async () => {
        await setupSwapAccounts(fromAccount, toAccount, "skip-onboarding-with-last-seen-device");
      });

      tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
      tags.forEach(tag => $Tag(tag));
      it(`Shows LNS not supported banner for ${unsupportedProvider.uiName}`, async () => {
        const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount, [
          unsupportedProvider.name,
        ]);

        await performSwapUntilQuoteSelectionStep(fromAccount, toAccount, minAmount);
        await app.swapLiveApp.selectSpecificProvider(unsupportedProvider.uiName);
        await app.swapLiveApp.checkLnsNotSupportedBanner(unsupportedProvider.uiName);
      });
    },
  );
}

export function runTooLowAmountForQuoteSwapsTest(
  swap: SwapType,
  tmsLinks: string[],
  errorMessage: string | RegExp,
  ctaBanner: boolean,
  quotesVisible: boolean,
  tags: string[],
) {
  describe(`Swap - with too low amount (throwing UI errors) - ${swap.amount} ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`, () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunctionSwap({
        userdata: "skip-onboarding",
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
        await app.swapLiveApp.checkCtaBanner(quotesVisible);
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
      await beforeAllFunctionSwap({
        speculosApp: AppInfos.EXCHANGE,
        cliCommandsOnApp: [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(fromAccount),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(toAccount),
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
      const provider = await app.swapLiveApp.selectExchange();
      await app.common.disableSynchronizationForiOS();
      await app.swapLiveApp.tapExecuteSwap(provider.uiName);
      await app.swap.verifyAmountsAndRejectSwap(rejectedSwap, minAmount);
      await app.swapLiveApp.checkErrorMessage("Please retry or contact Ledger Support if in doubt");
    });
  });
}

export function runSwapHistoryOperationsTest(
  swap: SwapType,
  provider: SwapProvider,
  swapId: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap history", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunctionSwap({
        userdata: "swap-history",
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
  provider: SwapProvider,
  swapId: string,
  addressFrom: string,
  addressTo: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap history", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunctionSwap({
        userdata: "swap-history",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Export swap history operations - ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`, async () => {
      swap.accountToDebit.address = addressFrom;
      swap.accountToCredit.address = addressTo;
      await app.swap.goToSwapHistory();
      await app.swap.clickExportOperations();
      await app.swap.checkExportedFileContents(swap, provider, swapId);
    });
  });
}

export function runSwapHistoryFeedbackTest(tmsLinks: string[], tags: string[]) {
  const swapHistoryFeedbackFormUrl =
    "https://form.typeform.com/to/FIHc3fk2?typeform-source=ledger.typeform.com#source=mobile";
  describe("Swap history", () => {
    beforeAll(async () => {
      await beforeAllFunctionSwap({
        userdata: "swap-history",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("Check feedback form URL from swap history", async () => {
      await app.swap.goToSwapHistory();
      await app.swap.checkSwapHistoryFeedbackFormUrl(swapHistoryFeedbackFormUrl);
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
      await beforeAllFunctionSwap({
        userdata: "skip-onboarding",
        speculosApp: AppInfos.EXCHANGE,
        cliCommandsOnApp: [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataCommand(fromAccount),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataCommand(toAccount),
          },
        ],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Swap max amount from ${fromAccount.currency.name} to ${toAccount.currency.name}`, async () => {
      await app.swapLiveApp.tapFromCurrency();

      const isModularDrawer = await app.modularDrawer.isFlowEnabled("live_app");
      if (isModularDrawer) {
        await app.modularDrawer.performSearchByTicker(fromAccount.currency.ticker);
        await app.modularDrawer.selectCurrencyByTicker(fromAccount.currency.ticker);
        let networkName = fromAccount?.parentAccount
          ? fromAccount.parentAccount.currency.name
          : fromAccount.currency.speculosApp.name;
        await app.modularDrawer.selectNetworkIfAsked(networkName);
        await app.modularDrawer.selectFirstAccount();
        await app.swapLiveApp.tapToCurrency();
        await app.modularDrawer.performSearchByTicker(toAccount.currency.ticker);
        await app.modularDrawer.selectCurrencyByTicker(toAccount.currency.ticker);
        networkName = toAccount?.parentAccount
          ? toAccount.parentAccount.currency.name
          : toAccount.currency.speculosApp.name;
        await app.modularDrawer.selectNetworkIfAsked(networkName);
        await app.modularDrawer.selectFirstAccount();
      } else {
        await app.common.performSearch(fromAccount.currency.name);
        await app.stake.selectCurrency(fromAccount.currency.id);
        await app.common.selectFirstAccount();
        await app.swapLiveApp.tapToCurrency();
        await app.common.performSearch(toAccount.currency.name);
        await app.stake.selectCurrency(toAccount.currency.id);
        await app.common.selectFirstAccount();
      }

      await app.swapLiveApp.clickSwapMax();
      const amountToSend = await app.swapLiveApp.getAmountToSend();

      await app.swapLiveApp.tapGetQuotesButton();
      await app.swapLiveApp.waitForQuotes();

      const provider = await app.swapLiveApp.selectExchange();
      await app.common.disableSynchronizationForiOS();

      await app.swapLiveApp.tapExecuteSwap(provider.uiName);

      const swap = new Swap(fromAccount, toAccount, amountToSend);
      await app.swap.verifyAmountsAndAcceptSwap(swap, amountToSend);
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
      await beforeAllFunctionSwap({
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

async function validateSwapAssetsPage(accountFrom: string, accountTo: string) {
  await app.swapLiveApp.expectSwapLiveApp();
  await app.swapLiveApp.checkAssetFrom(accountFrom, "");
  await app.swapLiveApp.checkAssetTo(accountTo, "-");
}

async function openSwapFromPortfolioEntryPoint() {
  await app.portfolio.openViaDeeplink();
  if (isWallet40) {
    await app.mainNavigation.tapWallet40Tab("swap");
  } else {
    await app.transferMenuDrawer.open();
    await app.transferMenuDrawer.navigateToSwap();
  }
}

export function runSwapEntryPoints(account: Account, tmsLinks: string[], tags: string[]) {
  describe("Swap - Entry Points", () => {
    beforeAll(async () => {
      await beforeAllFunctionSwap({
        userdata: "speculos-tests-app",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("Access Swap from different entry points", async () => {
      await openSwapFromPortfolioEntryPoint();
      await validateSwapAssetsPage(account.currency.ticker, "");

      await app.account.openViaDeeplink();
      await app.account.goToAccountByName(account.accountName);
      await app.account.tapSwap();
      await validateSwapAssetsPage("", account.currency.ticker);

      await app.portfolio.openViaDeeplink();
      await app.portfolio.goToSpecificAsset(account.currency.name);
      await app.assetAccountsPage.tapOnAssetQuickActionButton("swap");
      await validateSwapAssetsPage("", account.currency.ticker);
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
      await beforeAllFunctionSwap({
        userdata: "skip-onboarding",
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
      await app.swapLiveApp.verifySwapAmountErrorMessageIsCorrect(errorMessage);
    });
  });
}
