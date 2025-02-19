import test from "../../fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { Application } from "tests/page";
import { ElectronApplication } from "@playwright/test";

function setupEnv(disableBroadcast?: boolean) {
  const originalBroadcastValue = process.env.DISABLE_TRANSACTION_BROADCAST;
  test.beforeAll(async () => {
    process.env.SWAP_DISABLE_APPS_INSTALL = "true";
    process.env.SWAP_API_BASE = "https://swap-stg.ledger-test.com/v5";
    if (disableBroadcast) process.env.DISABLE_TRANSACTION_BROADCAST = "1";
  });
  test.afterAll(async () => {
    delete process.env.SWAP_DISABLE_APPS_INSTALL;
    delete process.env.SWAP_API_BASE;
    if (originalBroadcastValue !== undefined) {
      process.env.DISABLE_TRANSACTION_BROADCAST = originalBroadcastValue;
    } else {
      delete process.env.DISABLE_TRANSACTION_BROADCAST;
    }
  });
}

const app: AppInfos = AppInfos.EXCHANGE;

const swaps = [
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.02", Fee.MEDIUM),
    xrayTicket: "B2CQA-2750",
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.00067", Fee.MEDIUM),
    xrayTicket: "B2CQA-2744, B2CQA-2432",
  },
  {
    swap: new Swap(Account.ETH_USDT_1, Account.ETH_1, "40", Fee.MEDIUM),
    xrayTicket: "B2CQA-2752, B2CQA-2048",
  },
  {
    swap: new Swap(Account.ETH_1, Account.SOL_1, "0.018", Fee.MEDIUM),
    xrayTicket: "B2CQA-2748",
  },
  {
    swap: new Swap(Account.ETH_1, Account.ETH_USDT_1, "0.02", Fee.MEDIUM),
    xrayTicket: "B2CQA-2749",
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.SOL_1, "0.0006", Fee.MEDIUM),
    xrayTicket: "B2CQA-2747",
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_USDT_1, "0.0006", Fee.MEDIUM),
    xrayTicket: "B2CQA-2746",
  },
  {
    swap: new Swap(Account.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "40", Fee.MEDIUM),
    xrayTicket: "B2CQA-2753",
  },
  {
    swap: new Swap(Account.ETH_USDT_1, Account.SOL_1, "60", Fee.MEDIUM),
    xrayTicket: "B2CQA-2751",
  },
  {
    swap: new Swap(Account.SOL_1, Account.ETH_1, "0.25", Fee.MEDIUM),
    xrayTicket: "B2CQA-2775",
  },
  {
    swap: new Swap(Account.SOL_1, Account.BTC_NATIVE_SEGWIT_1, "0.25", Fee.MEDIUM),
    xrayTicket: "B2CQA-2776",
  },
  {
    swap: new Swap(Account.SOL_1, Account.ETH_USDT_1, "0.25", Fee.MEDIUM),
    xrayTicket: "B2CQA-2777",
  },
  {
    swap: new Swap(Account.ETH_USDC_1, Account.ETH_1, "65", Fee.MEDIUM),
    xrayTicket: "B2CQA-2830",
  },
  {
    swap: new Swap(Account.ETH_USDC_1, Account.SOL_1, "45", Fee.MEDIUM),
    xrayTicket: "B2CQA-2831",
  },
  {
    swap: new Swap(Account.ETH_USDC_1, Account.BTC_NATIVE_SEGWIT_1, "65", Fee.MEDIUM),
    xrayTicket: "B2CQA-2832",
  },
  {
    swap: new Swap(Account.ETH_1, Account.DOT_1, "0.02", Fee.MEDIUM),
    xrayTicket: "B2CQA-3017",
  },
];

for (const { swap, xrayTicket } of swaps) {
  test.describe("Swap - Accepted (without tx broadcast)", () => {
    setupEnv(true);

    const accPair: string[] = [swap.accountToDebit, swap.accountToCredit].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );

    test.beforeEach(async () => {
      setExchangeDependencies(
        accPair.map(appName => ({
          name: appName,
        })),
      );
    });

    test.use({
      userdata: "speculos-tests-app",
      speculosApp: app,
    });

    test(
      `Swap ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`,
      {
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await performSwapUntilQuoteSelectionStep(app, electronApp, swap);
        const selectedProvider = await app.swap.selectExchange(electronApp);

        await performSwapUntilDeviceVerificationStep(app, electronApp, swap, selectedProvider);
        await app.speculos.verifyAmountsAndAcceptSwap(swap);
        await app.swapDrawer.verifyExchangeCompletedTextContent(swap.accountToCredit.currency.name);
      },
    );
  });
}

test.describe("Swap - Check Best Offer", () => {
  const swap = new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.02", Fee.MEDIUM);
  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [swap.accountToDebit, swap.accountToCredit].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    userdata: "speculos-tests-app",
    speculosApp: app,
  });

  test(
    `Swap ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name} - Check "Best Offer"`,
    {
      annotation: { type: "TMS", description: "B2CQA-2327" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap);
      await app.swap.selectExchange(electronApp);
      await app.swap.checkBestOffer(electronApp);
    },
  );
});

test.describe("Swap - Default currency when landing on swap", () => {
  const swap = new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.02", Fee.MEDIUM);
  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [swap.accountToDebit, swap.accountToCredit].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    userdata: "speculos-tests-app",
    speculosApp: app,
  });

  test(
    `Swap ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name} - Default currency`,
    {
      annotation: { type: "TMS", description: "B2CQA-3079" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());
      await app.swap.checkAssetFrom(electronApp, "BTC");
      await app.swap.checkAssetTo(electronApp, "");
    },
  );

  test(
    `Swap ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name} - Previous set up`,
    {
      annotation: { type: "TMS", description: "B2CQA-3080" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await performSwapUntilQuoteSelectionStep(app, electronApp, swap);
      await app.layout.goToAccounts();
      await app.swap.goAndWaitForSwapToBeReady(
        () => app.layout.goToSwap(),
        "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
      );
      await app.swap.checkAssetFrom(electronApp, swap.accountToDebit.currency.ticker);
      await app.swap.checkAssetTo(electronApp, swap.accountToCredit.currency.ticker);
    },
  );
});

test.describe("Swap - Rejected on device", () => {
  const rejectedSwap = new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.02", Fee.MEDIUM);
  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [rejectedSwap.accountToDebit, rejectedSwap.accountToCredit].map(
      acc => acc.currency.speculosApp.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    userdata: "speculos-tests-app",
    speculosApp: app,
  });

  test(
    `Swap ${rejectedSwap.accountToDebit.currency.name} to ${rejectedSwap.accountToCredit.currency.name}`,
    {
      annotation: { type: "TMS", description: "B2CQA-2212" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await performSwapUntilQuoteSelectionStep(app, electronApp, rejectedSwap);
      const selectedProvider = await app.swap.selectExchange(electronApp);

      await performSwapUntilDeviceVerificationStep(
        app,
        electronApp,
        rejectedSwap,
        selectedProvider,
      );
      await app.speculos.verifyAmountsAndRejectSwap(rejectedSwap);
      await app.swapDrawer.verifyExchangeErrorTextContent("Operation denied on device");
    },
  );
});

const tooLowAmountForQuoteSwaps = [
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.001", Fee.MEDIUM),
    xrayTicket: "B2CQA-2755",
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.00001", Fee.MEDIUM),
    xrayTicket: "B2CQA-2758",
  },
  {
    swap: new Swap(Account.ETH_USDT_1, Account.ETH_1, "150", Fee.MEDIUM),
    xrayTicket: "B2CQA-2759",
  },
  {
    swap: new Swap(Account.TRX_1, Account.ETH_1, "70", Fee.MEDIUM),
    xrayTicket: "B2CQA-2739",
  },
];

for (const { swap, xrayTicket } of tooLowAmountForQuoteSwaps) {
  test.describe("Swap - with too low amount (throwing UI errors)", () => {
    setupEnv(true);

    const accPair: string[] = [swap.accountToDebit, swap.accountToCredit].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );

    test.beforeEach(async () => {
      setExchangeDependencies(
        accPair.map(appName => ({
          name: appName,
        })),
      );
    });

    test.use({
      userdata: "speculos-tests-app",
      speculosApp: app,
    });

    test(
      `Swap too low quote amounts from ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`,
      {
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await performSwapUntilQuoteSelectionStep(app, electronApp, swap);
        const errorMessage = swap.accountToDebit.accountType
          ? "Not enough balance."
          : new RegExp(
              `Minimum \\d+(\\.\\d{1,10})? ${swap.accountToDebit.currency.ticker} needed for quotes\\.\\s*$`,
            );
        await app.swap.verifySwapAmountErrorMessageIsDisplayed(
          electronApp,
          swap.accountToDebit,
          errorMessage,
        );
        //following error doesn't appear if accountToDebit has accountType erc20
        if (!swap.accountToDebit.accountType) {
          await app.swap.fillInOriginCurrencyAmount(electronApp, "");
          await app.swap.fillInOriginCurrencyAmount(
            electronApp,
            (parseFloat(swap.amount) * 1000).toString(),
          );
          await app.swap.verifySwapAmountErrorMessageIsDisplayed(
            electronApp,
            swap.accountToDebit,
            "Not enough balance, including network fee.",
          );
          await app.swap.fillInOriginCurrencyAmount(electronApp, "");
          await app.swap.fillInOriginCurrencyAmount(
            electronApp,
            (parseFloat(swap.amount) * 100_000_000).toString(),
          );
          await app.swap.verifySwapAmountErrorMessageIsDisplayed(
            electronApp,
            swap.accountToDebit,
            "Not enough balance, including network fee.",
          );
        }
      },
    );
  });
}

const swapEntryPoint = {
  swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.0006", Fee.MEDIUM),
};

test.describe("Swap flow from different entry point", () => {
  setupEnv(true);

  test.use({
    userdata: "speculos-tests-app",
    speculosApp: app,
  });

  test(
    "Entry Point - Portfolio page",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2985",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToPortfolio();
      await app.swap.goAndWaitForSwapToBeReady(() => app.portfolio.clickSwapButton());
      await app.swap.expectSelectedAssetDisplayed("BTC", electronApp);
    },
  );

  test(
    "Entry Point - Asset Allocation",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2986",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToPortfolio();
      await app.portfolio.clickOnSelectedAssetRow(swapEntryPoint.swap.accountToDebit.currency.name);
      await app.swap.goAndWaitForSwapToBeReady(() => app.assetPage.startSwapFlow());
      await app.swap.expectSelectedAssetDisplayed(
        swapEntryPoint.swap.accountToDebit.currency.name,
        electronApp,
      );
    },
  );

  test(
    "Entry Point - Market page - Click on swap for any coin",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2987",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToMarket();
      await app.swap.goAndWaitForSwapToBeReady(() =>
        app.market.startSwapForSelectedTicker(swapEntryPoint.swap.accountToDebit.currency.ticker),
      );
      await app.swap.expectSelectedAssetDisplayed(
        swapEntryPoint.swap.accountToDebit.currency.name,
        electronApp,
      );
      await app.swap.expectSelectedAssetDisplayed(
        swapEntryPoint.swap.accountToDebit.accountName,
        electronApp,
      );
    },
  );

  test(
    "Entry Point - Market page - More than one account for an asset",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2988",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToMarket();
      await app.market.openCoinPage(swapEntryPoint.swap.accountToDebit.currency.ticker);
      await app.swap.goAndWaitForSwapToBeReady(() => app.market.clickOnSwapButtonOnAsset());
      await app.swap.expectSelectedAssetDisplayed(
        swapEntryPoint.swap.accountToDebit.currency.name,
        electronApp,
      );
    },
  );

  test(
    "Entry Point - Account page",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2989",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(swapEntryPoint.swap.accountToDebit.accountName);
      await app.swap.goAndWaitForSwapToBeReady(() => app.account.navigateToSwap());
      await app.swap.expectSelectedAssetDisplayed(
        swapEntryPoint.swap.accountToDebit.currency.name,
        electronApp,
      );
      await app.swap.expectSelectedAssetDisplayed(
        swapEntryPoint.swap.accountToDebit.accountName,
        electronApp,
      );
    },
  );

  test(
    "Entry Point - left menu",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2990, B2CQA-523",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());
      await app.swap.expectSelectedAssetDisplayed("BTC", electronApp);
    },
  );
});

async function performSwapUntilQuoteSelectionStep(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
) {
  await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

  await app.swap.selectAssetFrom(electronApp, swap.accountToDebit);
  await app.swapDrawer.selectAccountByName(swap.accountToDebit);
  await app.swap.selectAssetTo(electronApp, swap.accountToCredit.currency.name);
  await app.swapDrawer.selectAccountByName(swap.accountToCredit);
  await app.swap.fillInOriginCurrencyAmount(electronApp, swap.amount);
}

async function performSwapUntilDeviceVerificationStep(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
  selectedProvider: any,
) {
  await app.swap.clickExchangeButton(electronApp, selectedProvider);

  const amountTo = await app.swapDrawer.getAmountToReceive();
  const fees = await app.swapDrawer.getFees();

  swap.setAmountToReceive(amountTo);
  swap.setFeesAmount(fees);

  await app.swapDrawer.verifyAmountToReceive(amountTo);
  await app.swapDrawer.verifyAmountSent(swap.amount, swap.accountToDebit.currency.ticker);
  await app.swapDrawer.verifySourceAccount(swap.accountToDebit.currency.name);
  await app.swapDrawer.verifyTargetCurrency(swap.accountToCredit.currency.name);
  await app.swapDrawer.verifyProvider(selectedProvider);
}
