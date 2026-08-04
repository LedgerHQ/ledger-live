import { Device } from "@ledgerhq/live-e2e-shared/enum/Device";
import { SwapType } from "@ledgerhq/live-e2e-shared/models/Swap";
import { Account, type AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import { performSwapUntilQuoteSelectionStep, truncateSwapAmount } from "../../../utils/swapUtils";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setEnv } from "@shared/env";
import { beforeAllFunctionSwap } from "../swap.setup";
import { setTeamOwner } from "../../../helpers/allure/allure-helper";
import type { SwapTransactionStatusDetails } from "../../../page/drawer/swapTransactionStatus.drawer";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

async function handleAssetSwap(asset: Account, hasAccount: boolean) {
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
}

export function runSwapWithoutAccountTest(
  asset1: Account,
  asset2: Account,
  testTitle: string,
  tmsLinks: string[],
  event: "noAccountTo" | "noAccountFrom" | "noAccountFromAndTo",
  tags: string[],
) {
  const debitCurrency = (event === "noAccountFrom" ? asset2 : asset1).currency;
  const creditCurrency = (event === "noAccountFrom" ? asset1 : asset2).currency;

  describe("Swap - account not present", () => {
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

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${debitCurrency.testLabel}-${creditCurrency.testLabel}] - ${testTitle}`, async () => {
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
  describe("Swap - using a different seed", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunctionSwap({
        userdata: userData,
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${swap.accountToDebit.currency.testLabel}-${swap.accountToCredit.currency.testLabel}] - Swap using a different seed`, async () => {
      swap.accountToDebit.address = addressFrom;
      swap.accountToCredit.address = addressTo;
      const minAmount = await app.swapLiveApp.getMinimumAmount(
        swap.accountToDebit,
        swap.accountToCredit,
      );
      const swapAmount = minAmount ? truncateSwapAmount(minAmount) : minAmount;
      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        swapAmount,
      );
      const provider = await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.checkExchangeButtonHasProviderName(provider.uiName);
      await app.common.disableSynchronizationForiOS();
      await app.swapLiveApp.tapExecuteSwap(provider.uiName);
      if (errorMessage) {
        await app.swapLiveApp.checkErrorMessage(errorMessage);
      } else {
        await app.swap.verifyAmountsAndAcceptSwapForDifferentSeed(swap, swapAmount, errorMessage);
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
  describe("Swap - landing page", () => {
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

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap landing page and best offer`, async () => {
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

      await app.mainNavigation.openPortfolioViaDeeplink();
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

      setTeamOwner(Team.SWAP);
      tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
      tags.forEach(tag => $Tag(tag));
      it(`Swap LNS not supported banner for ${unsupportedProvider.uiName}`, async () => {
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
  describe("Swap - too low amount", () => {
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

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${swap.accountToDebit.currency.testLabel}-${swap.accountToCredit.currency.testLabel}] - Swap too low quote amount (${swap.amount}): ${errorMessage}`, async () => {
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
  describe("Swap - rejected on device", () => {
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

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap refused on device`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount);
      const rejectAmount = minAmount ? truncateSwapAmount(minAmount) : minAmount;
      const rejectedSwap = new Swap(fromAccount, toAccount, rejectAmount);

      await performSwapUntilQuoteSelectionStep(
        rejectedSwap.accountToDebit,
        rejectedSwap.accountToCredit,
        rejectAmount,
      );
      const provider = await app.swapLiveApp.selectExchange();
      await app.common.disableSynchronizationForiOS();
      await app.swapLiveApp.tapExecuteSwap(provider.uiName);
      await app.swap.verifyAmountsAndRejectSwap(rejectedSwap, rejectAmount);
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
  details: SwapTransactionStatusDetails,
) {
  describe("Swap - history", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunctionSwap({
        userdata: "swap-history",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${swap.accountToDebit.currency.testLabel}-${swap.accountToCredit.currency.testLabel}] - Swap history is visible from the swap history page`, async () => {
      await app.swap.goToSwapHistory();
      await app.swap.checkSwapOperation(swapId, swap);
      await app.swap.openSelectedOperation(swapId);
      await app.swapTransactionStatusDrawer.expectSwapTransactionStatusDrawerInfos(
        swapId.slice(0, 8),
        provider,
        details,
      );
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
  describe("Swap - history", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunctionSwap({
        userdata: "swap-history",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${swap.accountToDebit.currency.testLabel}-${swap.accountToCredit.currency.testLabel}] - Export swap history operations`, async () => {
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
  describe("Swap - history", () => {
    beforeAll(async () => {
      await beforeAllFunctionSwap({
        userdata: "swap-history",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("Swap feedback form URL from swap history", async () => {
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
  describe("Swap - send max", () => {
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

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap max amount`, async () => {
      await app.swapLiveApp.tapFromCurrency();
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
  describe("Swap - switch currencies", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(swap);
      await beforeAllFunctionSwap({
        userdata: "speculos-tests-app",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${swap.accountToDebit.currency.testLabel}-${swap.accountToCredit.currency.testLabel}] - Switch you send and you receive currency`, async () => {
      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        swap.amount,
        false,
      );
      await app.swapLiveApp.switchYouSendAndYouReceive();
      await app.swapLiveApp.checkAssetFrom(swap.accountToCredit.currency.ticker, "");
      await app.swapLiveApp.checkAssetTo(swap.accountToDebit.currency.ticker, "0");
    });
  });
}

async function validateSwapAssetsPage(accountFrom: string, accountTo: string) {
  await app.swapLiveApp.expectSwapLiveApp();
  await app.swapLiveApp.checkAssetFrom(accountFrom, "");
  await app.swapLiveApp.checkAssetTo(accountTo, "0");
}

async function openSwapFromPortfolioEntryPoint() {
  await app.mainNavigation.openPortfolioViaDeeplink();
  await app.mainNavigation.tapWallet40Tab("swap");
}

export function runSwapEntryPoints(account: Account, tmsLinks: string[], tags: string[]) {
  describe("Swap - entry points", () => {
    beforeAll(async () => {
      await beforeAllFunctionSwap({
        userdata: "speculos-tests-app",
        speculosApp: AppInfos.EXCHANGE,
      });
    });

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${account.currency.testLabel}] - Swap entry points`, async () => {
      await openSwapFromPortfolioEntryPoint();
      await validateSwapAssetsPage(account.currency.ticker, "");

      await app.account.openViaDeeplink();
      await app.account.goToAccountByName(account.accountName);
      await app.account.tapSwap();
      await validateSwapAssetsPage("", account.currency.ticker);

      await app.mainNavigation.openPortfolioViaDeeplink();
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
  describe("Swap - network fees above balance", () => {
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

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it(`[${swap.accountToDebit.currency.testLabel}-${swap.accountToCredit.currency.testLabel}] - Swap network fees above account balance`, async () => {
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

export function runSwapDiscreetModeTest(
  accounts: AccountType[],
  balanceCheckAccount: AccountType,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap - discreet mode", () => {
    beforeAll(async () => {
      await beforeAllFunctionSwap({
        userdata: "discreet-mode",
        cliCommandsOnApp: [
          {
            app: Account.BTC_NATIVE_SEGWIT_1.currency.speculosApp,
            cmd: liveDataWithAddressCommand(Account.BTC_NATIVE_SEGWIT_1),
          },
          {
            app: Account.ETH_1.currency.speculosApp,
            cmd: liveDataWithAddressCommand(Account.ETH_1),
          },
        ],
      });
    });

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it("Swap amount is hidden in the asset drawer in discreet mode", async () => {
      const tickers = accounts.map(account => account.currency.ticker);
      await app.swapLiveApp.tapFromCurrency();
      await app.modularDrawer.checkSelectAssetPage();
      await app.modularDrawer.checkAssetAmountsAreDiscreet(tickers);
    });

    it("Swap balance is hidden in the swap main form in discreet mode", async () => {
      // Masking is currency-agnostic, so a single account is enough here.
      await app.swapLiveApp.tapFromCurrency();
      await app.modularDrawer.selectAsset(balanceCheckAccount);
      await app.swapLiveApp.checkAssetFromContains(balanceCheckAccount.currency.ticker);
      await app.swapLiveApp.checkFromAccountBalanceIsDiscreet(balanceCheckAccount.currency.ticker);
    });
  });
}
