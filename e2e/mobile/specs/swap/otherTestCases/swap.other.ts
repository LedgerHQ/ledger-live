import { Device } from "@ledgerhq/live-e2e-shared/enum/Device";
import { SwapType } from "@ledgerhq/live-e2e-shared/models/Swap";
import { Account, type AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import { performSwapUntilQuoteSelectionStep, truncateSwapAmount } from "@e2e/utils/swapUtils";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setEnv } from "@shared/env";
import { beforeAllFunctionSwap, SwapAccountsTestOptions } from "@e2e/specs/swap/swap.setup";
import { swapSetup } from "@e2e/bridge/server";
import { TIMEOUT } from "@e2e/utils/timeouts";
import {
  getExpectedSeparators,
  buildFormattedAmountPattern,
} from "@ledgerhq/live-e2e-shared/data/numberFormat";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import type { SwapTransactionStatusDetails } from "@e2e/page/drawer/swapTransactionStatus.drawer";
import type { TestMetaOptions } from "@e2e/models/testOptions";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

async function handleAssetSwap(asset: Account, hasAccount: boolean) {
  await app.modularDrawer.selectCurrency(asset.currency);
  const networkName = asset?.parentAccount
    ? asset.parentAccount.currency.name
    : asset.currency.speculosApp.name;
  await app.modularDrawer.selectNetworkIfAsked(networkName);

  if (hasAccount) {
    await app.modularDrawer.selectFirstAccount();
  } else {
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
    await app.addAccount.addAccountAtIndex({
      currencyName: `${asset.currency.name} 1`,
      currencyId: asset.currency.id,
      index: 0,
    });
  }
}

type RunSwapWithoutAccountTestOptions = TestMetaOptions & {
  asset1: Account;
  asset2: Account;
  testTitle: string;
  event: "noAccountTo" | "noAccountFrom" | "noAccountFromAndTo";
};

export function runSwapWithoutAccountTest(options: RunSwapWithoutAccountTestOptions) {
  const { asset1, asset2, testTitle, tmsLinks, event, tags } = options;
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

type RunSwapWithDifferentSeedTestOptions = TestMetaOptions & {
  swap: SwapType;
  userData: string;
  errorMessage: string | null;
  addressFrom: string;
  addressTo: string;
  lnsErrorMessage?: string;
};

export function runSwapWithDifferentSeedTest(options: RunSwapWithDifferentSeedTestOptions) {
  const { swap, userData, errorMessage, addressFrom, addressTo, tmsLinks, tags, lnsErrorMessage } =
    options;
  // LNS is frozen on Exchange 3.4.1, which rejects a payout address from another seed (0x6a83)
  // instead of showing the "Receive address does not belong" warning added in 4.3.0. The payout
  // check runs before the refund check, so LNS reports the receiving account first.
  const expectedErrorMessage =
    process.env.SPECULOS_DEVICE === Device.LNS.name && lnsErrorMessage
      ? lnsErrorMessage
      : errorMessage;

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
      const minAmount = await app.swapLiveApp.getMinimumAmount({
        fromAccount: swap.accountToDebit,
        toAccount: swap.accountToCredit,
      });
      const swapAmount = minAmount ? truncateSwapAmount(minAmount) : minAmount;
      await performSwapUntilQuoteSelectionStep({
        accountToDebit: swap.accountToDebit,
        accountToCredit: swap.accountToCredit,
        amount: swapAmount,
      });
      const provider = await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.checkQuoteCardCtaPresence(provider.uiName);
      await app.common.disableSynchronizationForiOS();
      await app.swapLiveApp.tapExecuteSwap(provider.uiName);
      if (expectedErrorMessage) {
        await app.swapLiveApp.checkErrorMessage(expectedErrorMessage);
      } else {
        await app.swap.verifyAmountsAndAcceptSwapForDifferentSeed({
          swap,
          amount: swapAmount,
          errorMessage,
        });
        await app.swap.waitForSuccessAndContinue();
      }
    });
  });
}

type RunSwapLandingPageTestOptions = Omit<SwapAccountsTestOptions, "tmsLinks"> & {
  tmsLinks: { landingPage: string[]; formatting: string[] };
};

export function runSwapLandingPageTest(options: RunSwapLandingPageTestOptions) {
  const { fromAccount, toAccount, tmsLinks, tags } = options;
  setTeamOwner(Team.SWAP);
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

    tmsLinks.landingPage.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap landing page and best offer`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount({ fromAccount, toAccount });
      const swap = new Swap({
        accountToDebit: fromAccount,
        accountToCredit: toAccount,
        amount: minAmount,
      });

      await performSwapUntilQuoteSelectionStep({
        accountToDebit: swap.accountToDebit,
        accountToCredit: swap.accountToCredit,
        amount: minAmount,
      });
      const providerList = await app.swapLiveApp.getProviderList();
      await app.swapLiveApp.checkFirstQuoteContainerInfos(providerList);
      await app.swapLiveApp.checkBestOffer(providerList);

      await app.mainNavigation.openPortfolioViaDeeplink();
      await app.swap.openViaDeeplink();
      await app.swapLiveApp.expectSwapLiveAppForm();
      await app.swapLiveApp.checkAssetFromMatchesAccount(fromAccount);
      await app.swapLiveApp.checkAssetToMatchesAccount(toAccount);
    });

    tmsLinks.formatting.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("Swap amounts are formatted correctly for language: Français", async () => {
      await app.mainNavigation.openPortfolioViaDeeplink();
      await app.mainNavigation.navigateToSettings();
      await app.settings.navigateToGeneralSettings();
      await app.settingsGeneral.navigateToLanguageSelect();
      await app.settingsGeneral.selectLanguage("Français");
      await swapSetup();
      await app.swap.openViaDeeplink();
      await app.swapLiveApp.expectSwapLiveApp();

      const separators = getExpectedSeparators("fr");
      const minAmount = await app.swapLiveApp.getMinimumAmount({ fromAccount, toAccount });
      await performSwapUntilQuoteSelectionStep({
        accountToDebit: fromAccount,
        accountToCredit: toAccount,
        amount: minAmount,
        continueToQuotes: false,
      });
      await app.swapLiveApp.clickSwapMax(buildFormattedAmountPattern(separators), TIMEOUT.large);
      await app.swapLiveApp.tapGetQuotesButton();
      await app.swapLiveApp.waitForQuotes();
      await app.swapLiveApp.checkAmountsFormatting(separators);
    });
  });
}

type SetupSwapAccountsOptions = {
  fromAccount: Account;
  toAccount: Account;
  userdata?: string;
};

async function setupSwapAccounts(options: SetupSwapAccountsOptions) {
  const { fromAccount, toAccount, userdata = "skip-onboarding" } = options;
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

type RunSwapLnsNotSupportedBannerTestOptions = SwapAccountsTestOptions & {
  unsupportedProvider: SwapProvider;
};

export function runSwapLnsNotSupportedBannerTest(options: RunSwapLnsNotSupportedBannerTestOptions) {
  const { fromAccount, toAccount, unsupportedProvider, tmsLinks, tags } = options;
  (process.env.SPECULOS_DEVICE === Device.LNS.name ? describe : describe.skip)(
    "Swap - LNS not supported banner",
    () => {
      beforeAll(async () => {
        await setupSwapAccounts({
          fromAccount,
          toAccount,
          userdata: "skip-onboarding-with-last-seen-device",
        });
      });

      setTeamOwner(Team.SWAP);
      tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
      tags.forEach(tag => $Tag(tag));
      it(`Swap LNS not supported banner for ${unsupportedProvider.uiName}`, async () => {
        const minAmount = await app.swapLiveApp.getMinimumAmount({
          fromAccount,
          toAccount,
          providersWhitelist: [unsupportedProvider.name],
        });

        await performSwapUntilQuoteSelectionStep({
          accountToDebit: fromAccount,
          accountToCredit: toAccount,
          amount: minAmount,
        });
        await app.swapLiveApp.selectSpecificProvider(unsupportedProvider.uiName);
        await app.swapLiveApp.checkLnsNotSupportedBanner(unsupportedProvider.uiName);
      });
    },
  );
}

type RunTooLowAmountForQuoteSwapsTestOptions = TestMetaOptions & {
  swap: SwapType;
  errorMessage: string | RegExp;
  ctaBanner: boolean;
  quotesVisible: boolean;
};

export function runTooLowAmountForQuoteSwapsTest(options: RunTooLowAmountForQuoteSwapsTestOptions) {
  const { swap, tmsLinks, errorMessage, ctaBanner, quotesVisible, tags } = options;
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
      const minAmount = await app.swapLiveApp.getMinimumAmount({
        fromAccount: swap.accountToDebit,
        toAccount: swap.accountToCredit,
      });

      const actualAmount = swap.amount === "USE_MIN_AMOUNT" ? minAmount : swap.amount;

      await performSwapUntilQuoteSelectionStep({
        accountToDebit: swap.accountToDebit,
        accountToCredit: swap.accountToCredit,
        amount: actualAmount,
        continueToQuotes: quotesVisible,
      });
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

export function runUserRefusesTransactionTest(options: SwapAccountsTestOptions) {
  const { fromAccount, toAccount, tmsLinks, tags } = options;
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
      const minAmount = await app.swapLiveApp.getMinimumAmount({ fromAccount, toAccount });
      const rejectAmount = minAmount ? truncateSwapAmount(minAmount) : minAmount;
      const rejectedSwap = new Swap({
        accountToDebit: fromAccount,
        accountToCredit: toAccount,
        amount: rejectAmount,
      });

      await performSwapUntilQuoteSelectionStep({
        accountToDebit: rejectedSwap.accountToDebit,
        accountToCredit: rejectedSwap.accountToCredit,
        amount: rejectAmount,
      });
      const provider = await app.swapLiveApp.selectExchange();
      await app.common.disableSynchronizationForiOS();
      await app.swapLiveApp.tapExecuteSwap(provider.uiName);
      await app.swap.verifyAmountsAndRejectSwap(rejectedSwap, rejectAmount);
      await app.swapLiveApp.checkSwapRefused();
    });
  });
}

type SwapHistoryTestOptions = TestMetaOptions & {
  swap: SwapType;
  provider: SwapProvider;
  swapId: string;
};

type RunSwapHistoryOperationsTestOptions = SwapHistoryTestOptions & {
  details: SwapTransactionStatusDetails;
};

export function runSwapHistoryOperationsTest(options: RunSwapHistoryOperationsTestOptions) {
  const { swap, provider, swapId, tmsLinks, tags, details } = options;
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
      await app.swapTransactionStatusDrawer.expectSwapTransactionStatusDrawerInfos({
        swapIdPrefix: swapId.slice(0, 8),
        provider,
        details,
      });
    });
  });
}

type RunExportSwapHistoryOperationsTestOptions = SwapHistoryTestOptions & {
  addressFrom: string;
  addressTo: string;
};

export function runExportSwapHistoryOperationsTest(
  options: RunExportSwapHistoryOperationsTestOptions,
) {
  const { swap, provider, swapId, addressFrom, addressTo, tmsLinks, tags } = options;
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
      await app.swap.checkExportedFileContents({ swap, provider, id: swapId });
    });
  });
}

export function runSwapHistoryFeedbackTest(options: TestMetaOptions) {
  const { tmsLinks, tags } = options;
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

export function runSwapWithSendMaxTest(options: SwapAccountsTestOptions) {
  const { fromAccount, toAccount, tmsLinks, tags } = options;
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
      await app.modularDrawer.selectCurrency(fromAccount.currency);
      let networkName = fromAccount?.parentAccount
        ? fromAccount.parentAccount.currency.name
        : fromAccount.currency.speculosApp.name;
      await app.modularDrawer.selectNetworkIfAsked(networkName);
      await app.modularDrawer.selectFirstAccount();
      await app.swapLiveApp.tapToCurrency();
      await app.modularDrawer.selectCurrency(toAccount.currency);
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

      const swap = new Swap({
        accountToDebit: fromAccount,
        accountToCredit: toAccount,
        amount: amountToSend,
      });
      await app.swap.verifyAmountsAndAcceptSwap(swap, amountToSend);
      await app.swap.waitForSuccessAndContinue();
    });
  });
}

type ValidateSwapAssetsPageOptions = {
  accountFrom: string;
  accountTo: string;
};

async function validateSwapAssetsPage(options: ValidateSwapAssetsPageOptions) {
  const { accountFrom, accountTo } = options;
  await app.swapLiveApp.expectSwapLiveApp();
  await app.swapLiveApp.checkAssetFrom({ currency: accountFrom, amount: "" });
  await app.swapLiveApp.checkAssetTo({ currency: accountTo, amount: "0" });
}

async function openSwapFromPortfolioEntryPoint() {
  await app.mainNavigation.openPortfolioViaDeeplink();
  await app.mainNavigation.tapWallet40Tab("swap");
}

type RunSwapEntryPointsOptions = TestMetaOptions & {
  account: Account;
};

export function runSwapEntryPoints(options: RunSwapEntryPointsOptions) {
  const { account, tmsLinks, tags } = options;
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
      await validateSwapAssetsPage({ accountFrom: account.currency.ticker, accountTo: "" });

      await app.account.openViaDeeplink();
      await app.account.goToAccountByName(account.accountName);
      await app.account.tapSwap();
      await validateSwapAssetsPage({ accountFrom: "", accountTo: account.currency.ticker });

      await app.mainNavigation.openPortfolioViaDeeplink();
      await app.portfolio.goToSpecificAsset(account.currency.name);
      await app.assetAccountsPage.tapOnAssetQuickActionButton("swap");
      await validateSwapAssetsPage({ accountFrom: "", accountTo: account.currency.ticker });
    });
  });
}

type RunSwapNetworkFeesAboveAccountBalanceTestOptions = TestMetaOptions & {
  swap: SwapType;
  errorMessage: string | RegExp;
};

export function runSwapNetworkFeesAboveAccountBalanceTest(
  options: RunSwapNetworkFeesAboveAccountBalanceTestOptions,
) {
  const { swap, errorMessage, tmsLinks, tags } = options;
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
      const minAmount = await app.swapLiveApp.getMinimumAmount({
        fromAccount: swap.accountToDebit,
        toAccount: swap.accountToCredit,
      });

      const actualAmount = swap.amount === "USE_MIN_AMOUNT" ? minAmount : swap.amount;

      await performSwapUntilQuoteSelectionStep({
        accountToDebit: swap.accountToDebit,
        accountToCredit: swap.accountToCredit,
        amount: actualAmount,
      });
      await app.swapLiveApp.checkQuotes();
      await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.verifySwapAmountErrorMessageIsCorrect(errorMessage);
    });
  });
}

type RunSwapDiscreetModeTestOptions = TestMetaOptions & {
  accounts: AccountType[];
  balanceCheckAccount: AccountType;
};

export function runSwapDiscreetModeTest(options: RunSwapDiscreetModeTestOptions) {
  const { accounts, balanceCheckAccount, tmsLinks, tags } = options;
  setTeamOwner(Team.SWAP);
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

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it("Swap amount is hidden in the asset drawer in discreet mode", async () => {
      const currencies = accounts.map(account => account.currency);
      await app.swapLiveApp.tapFromCurrency();
      await app.modularDrawer.checkSelectAssetPage();
      await app.modularDrawer.checkAssetAmountsAreDiscreet(currencies);
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    it("Swap balance is hidden in the swap main form in discreet mode", async () => {
      // Masking is currency-agnostic, so a single account is enough here.
      await app.swapLiveApp.tapFromCurrency();
      await app.modularDrawer.selectAsset(balanceCheckAccount);
      await app.swapLiveApp.checkAssetFromContains(balanceCheckAccount.currency.ticker);
      await app.swapLiveApp.checkFromAccountBalanceIsDiscreet(balanceCheckAccount.currency.ticker);
    });
  });
}
