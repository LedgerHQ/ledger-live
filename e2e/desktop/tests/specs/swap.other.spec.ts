import test from "../fixtures/common";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { addTmsLink } from "../utils/allureUtils";
import { getDescription } from "../utils/customJsonReporter";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { CLI } from "../utils/cliUtils";
import {
  setupEnv,
  performSwapUntilQuoteSelectionStep,
  performSwapUntilDeviceVerificationStep,
} from "../utils/swapUtils";

const app: AppInfos = AppInfos.EXCHANGE;

const liveDataCommand = (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
  CLI.liveData({
    currency: currencyApp.name,
    index,
    add: true,
    appjson: userdataPath,
  });

const checkProviders = [
  {
    fromAccount: Account.ETH_1,
    toAccount: TokenAccount.ETH_USDT_1,
    xrayTicket: "B2CQA-3120",
    provider: Provider.ONE_INCH,
  },
  //ToDo: Enable when Paraswap is migrated to Velora
  // {
  //   fromAccount: Account.ETH_1,
  //   toAccount: TokenAccount.ETH_USDC_1,
  //   xrayTicket: "B2CQA-3119",
  //   provider: Provider.PARASWAP,
  // },
];

for (const { fromAccount, toAccount, xrayTicket, provider } of checkProviders) {
  test.describe("Swap - Provider redirection", () => {
    setupEnv(true);

    const accPair: string[] = [fromAccount, toAccount].map(acc =>
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
      userdata: "skip-onboarding",
      speculosApp: app,

      cliCommandsOnApp: [
        [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataCommand(fromAccount.currency.speculosApp, fromAccount.index),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataCommand(toAccount.currency.speculosApp, toAccount.index),
          },
        ],
        { scope: "test" },
      ],
    });

    test(
      `Swap test provider redirection (${provider.uiName})`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX"],
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
        const swap = new Swap(fromAccount, toAccount, minAmount);

        await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);

        await app.swap.selectSpecificProvider(provider.uiName, electronApp);
        await app.swap.goToProviderLiveApp(electronApp, provider.uiName);
        await app.swap.verifyProviderURL(electronApp, provider.uiName, swap);
        await app.liveApp.verifyLiveAppTitle(provider.uiName.toLowerCase());
      },
    );
  });
}

test.describe("Swap - Check Best Offer", () => {
  const fromAccount = Account.ETH_1;
  const toAccount = Account.BTC_NATIVE_SEGWIT_1;
  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [fromAccount, toAccount].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    userdata: "skip-onboarding",
    speculosApp: app,

    cliCommandsOnApp: [
      [
        {
          app: fromAccount.currency.speculosApp,
          cmd: liveDataCommand(fromAccount.currency.speculosApp, fromAccount.index),
        },
        {
          app: toAccount.currency.speculosApp,
          cmd: liveDataCommand(toAccount.currency.speculosApp, toAccount.index),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    `Swap ${fromAccount.currency.name} to ${toAccount.currency.name} - Check "Best Offer"`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX"],
      annotation: { type: "TMS", description: "B2CQA-2327" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);
      await app.swap.selectExchangeWithoutKyc(electronApp);
      await app.swap.checkBestOffer(electronApp);
    },
  );
});

test.describe("Swap - Default currency when landing on swap", () => {
  const fromAccount = Account.ETH_1;
  const toAccount = Account.BTC_NATIVE_SEGWIT_1;
  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [fromAccount, toAccount].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    userdata: "skip-onboarding",
    speculosApp: app,

    cliCommandsOnApp: [
      [
        {
          app: fromAccount.currency.speculosApp,
          cmd: liveDataCommand(fromAccount.currency.speculosApp, fromAccount.index),
        },
        {
          app: toAccount.currency.speculosApp,
          cmd: liveDataCommand(toAccount.currency.speculosApp, toAccount.index),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    `Swap ${fromAccount.currency.name} to ${toAccount.currency.name} - Default currency`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX"],
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
    `Swap ${fromAccount.currency.name} to ${toAccount.currency.name} - Previous set up`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX"],
      annotation: { type: "TMS", description: "B2CQA-3080" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);
      await app.layout.goToAccounts();
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());
      await app.swap.checkAssetFrom(electronApp, swap.accountToDebit.currency.ticker);
      await app.swap.checkAssetTo(electronApp, swap.accountToCredit.currency.ticker);
    },
  );
});

test.describe("Swap - Rejected on device", () => {
  const fromAccount = Account.ETH_1;
  const toAccount = Account.BTC_NATIVE_SEGWIT_1;

  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [fromAccount, toAccount].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    userdata: "skip-onboarding",
    speculosApp: app,

    cliCommandsOnApp: [
      [
        {
          app: fromAccount.currency.speculosApp,
          cmd: liveDataCommand(fromAccount.currency.speculosApp, fromAccount.index),
        },
        {
          app: toAccount.currency.speculosApp,
          cmd: liveDataCommand(toAccount.currency.speculosApp, toAccount.index),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    `Swap ${fromAccount.currency.name} to ${toAccount.currency.name}`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX"],
      annotation: { type: "TMS", description: "B2CQA-2212" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const rejectedSwap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, rejectedSwap, minAmount);
      const selectedProvider = await app.swap.selectExchangeWithoutKyc(electronApp);

      await performSwapUntilDeviceVerificationStep(
        app,
        electronApp,
        rejectedSwap,
        selectedProvider,
        minAmount,
      );
      await app.speculos.verifyAmountsAndRejectSwap(rejectedSwap, minAmount);
      await app.swapDrawer.verifyExchangeErrorTextContent("Operation denied on device");
    },
  );
});

test.describe("Swap - Landing page", () => {
  const fromAccount = Account.ETH_1;
  const toAccount = TokenAccount.ETH_USDC_1;

  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [fromAccount, toAccount].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    userdata: "skip-onboarding",
    speculosApp: app,

    cliCommandsOnApp: [
      [
        {
          app: fromAccount.currency.speculosApp,
          cmd: liveDataCommand(fromAccount.currency.speculosApp, fromAccount.index),
        },
        {
          app: toAccount.currency.speculosApp,
          cmd: liveDataCommand(toAccount.currency.speculosApp, toAccount.index),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    `Swap landing page`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX"],
      annotation: { type: "TMS", description: "B2CQA-2918" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);
      const providerList = await app.swap.getProviderList(electronApp);
      await app.swap.checkQuotesContainerInfos(electronApp, providerList);
      await app.swap.checkBestOffer(electronApp);
    },
  );
});

const swapWithDifferentSeed = [
  {
    swap: new Swap(Account.ETH_1, Account.SOL_1, "0.03"),
    xrayTicket: "B2CQA-3089",
    userData: "speculos-x-other-account",
    errorMessage:
      "This receiving account does not belong to the device you have connected. Please change and retry",
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.002"),
    xrayTicket: "B2CQA-3090",
    userData: "speculos-x-other-account",
    errorMessage:
      "This receiving account does not belong to the device you have connected. Please change and retry",
  },
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.03"),
    xrayTicket: "B2CQA-3091",
    userData: "speculos-x-other-account",
    errorMessage:
      "This sending account does not belong to the device you have connected. Please change and retry",
  },
];

for (const { swap, xrayTicket, userData, errorMessage } of swapWithDifferentSeed) {
  test.describe("Swap - Using different seed", () => {
    setupEnv(true);

    test.beforeEach(async () => {
      const accountPair: string[] = [swap.accountToDebit, swap.accountToCredit].map(acc =>
        acc.currency.speculosApp.name.replace(/ /g, "_"),
      );
      setExchangeDependencies(accountPair.map(name => ({ name })));
    });

    test.use({
      userdata: userData,
      speculosApp: app,
    });

    test(
      `Swap using a different seed - ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX"],
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        const minAmount = await app.swap.getMinimumAmount(
          swap.accountToDebit,
          swap.accountToCredit,
        );

        await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);
        const selectedProvider = await app.swap.selectExchangeWithoutKyc(electronApp);

        await app.swap.clickExchangeButton(electronApp, selectedProvider);

        await app.swapDrawer.checkErrorMessage(errorMessage);
      },
    );
  });
}

const swapWithoutAccount = [
  {
    account1: Account.BTC_NATIVE_SEGWIT_1,
    account2: Account.ETH_1,
    testTitle: "from Account present to Account not present",
    xrayTicket: "B2CQA-3353",
  },
  {
    account1: Account.ETH_1,
    account2: Account.BTC_NATIVE_SEGWIT_1,
    testTitle: "from Account not present to Account present",
    xrayTicket: "B2CQA-3354",
  },
];

for (const { account1, account2, xrayTicket, testTitle } of swapWithoutAccount) {
  test.describe("Swap a coin for which you have no account yet", () => {
    setupEnv(true);

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account2.currency.speculosApp,
      cliCommandsOnApp: [
        [
          {
            app: account1.currency.speculosApp,
            cmd: liveDataCommand(account1.currency.speculosApp, account1.index),
          },
        ],
        { scope: "test" },
      ],
    });

    test(
      `${testTitle}`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX"],
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app, electronApp, speculosApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

        const debitAccount = speculosApp ? account1 : account2;
        const creditAccount = speculosApp ? account2 : account1;

        await app.swap.selectAssetFrom(electronApp, debitAccount);
        await app.swapDrawer.selectAccountByName(debitAccount);

        await app.swap.selectAssetTo(electronApp, creditAccount.currency.name);
        await app.swapDrawer.clickOnAddAccountButton();

        await app.addAccount.addAccounts();
        await app.addAccount.done();
        await app.swapDrawer.selectAccountByName(creditAccount);
      },
    );
  });
}

test.describe("Swap a coin for which you have no account yet", () => {
  const account1 = Account.ETH_1;
  const account2 = Account.BSC_1;
  const xrayTicket = "B2CQA-3355";

  setupEnv(true);

  test.use({
    userdata: "1AccountDOT",
    speculosApp: account2.currency.speculosApp,
  });

  test(
    "from Account not present to Account not present",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX"],
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

      await app.swap.selectAssetFrom(electronApp, account1);
      await app.swapDrawer.clickOnAddAccountButton();
      await app.addAccount.addAccounts();
      await app.addAccount.done();
      await app.swapDrawer.selectAccountByName(account1);

      await app.swap.selectAssetTo(electronApp, account2.currency.name);
      await app.swapDrawer.clickOnAddAccountButton();
      await app.addAccount.addAccounts();
      await app.addAccount.done();
      await app.swapDrawer.selectAccountByName(account2);
    },
  );
});

const tooLowAmountForQuoteSwaps = [
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "1"),
    xrayTicket: "B2CQA-3239, B2CQA-3136",
    errorMessage: "Not enough balance, including network fee",
    ctaBanner: true,
    quotesVisible: true,
  },
  {
    swap: new Swap(TokenAccount.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "200"),
    xrayTicket: "B2CQA-3240",
    errorMessage: "Not enough balance",
    ctaBanner: false,
    quotesVisible: true,
  },
  {
    swap: new Swap(TokenAccount.ETH_USDT_2, Account.BTC_NATIVE_SEGWIT_1, "24"),
    xrayTicket: "B2CQA-3241",
    errorMessage: new RegExp(`\\d+(\\.\\d{1,10})? ETH needed for network fees\\.\\s*$`),
    ctaBanner: true,
    quotesVisible: true,
  },
  {
    swap: new Swap(TokenAccount.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "0.000001"),
    xrayTicket: "B2CQA-3242",
    errorMessage: new RegExp(`Minimum \\d+(\\.\\d{1,10})? USDT needed for quotes\\.\\s*$`),
    ctaBanner: false,
    quotesVisible: false,
  },
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "10000"),
    xrayTicket: "B2CQA-3243",
    errorMessage: new RegExp(/Not enough balance, including network fee\./),
    ctaBanner: true,
    quotesVisible: false,
  },
];

for (const swap of tooLowAmountForQuoteSwaps) {
  test.describe("Swap - with too low amount (throwing UI errors)", () => {
    setupEnv(true);

    const accPair: string[] = [swap.swap.accountToDebit, swap.swap.accountToCredit].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );

    const { accountToDebit, accountToCredit } = swap.swap;

    test.beforeEach(async () => {
      setExchangeDependencies(
        accPair.map(appName => ({
          name: appName,
        })),
      );
    });

    test.use({
      userdata: "skip-onboarding",
      speculosApp: app,

      cliCommandsOnApp: [
        [
          {
            app: accountToDebit.currency.speculosApp,
            cmd: liveDataCommand(accountToDebit.currency.speculosApp, accountToDebit.index),
          },
          {
            app: accountToCredit.currency.speculosApp,
            cmd: liveDataCommand(accountToCredit.currency.speculosApp, accountToCredit.index),
          },
        ],
        { scope: "test" },
      ],
    });

    test(
      `Swap too low quote amounts from ${swap.swap.accountToDebit.currency.name} to ${swap.swap.accountToCredit.currency.name} - ${swap.errorMessage}`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX"],
        annotation: {
          type: "TMS",
          description: swap.xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await performSwapUntilQuoteSelectionStep(
          app,
          electronApp,
          swap.swap,
          swap.swap.amount ?? "0",
        );
        if (swap.quotesVisible) {
          await app.swap.checkQuotes(electronApp);
          await app.swap.selectExchange(electronApp);
        }
        await app.swap.verifySwapAmountErrorMessageIsCorrect(electronApp, swap.errorMessage);
        if (swap.ctaBanner) {
          await app.swap.checkCtaBanner(electronApp);
        }
      },
    );
  });
}

test.describe("Swap - Switch You send and You receive currency", () => {
  const swap = new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.03");
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
    "Switch You send and You receive currency",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2136",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, swap.amount ?? "0");
      await app.swap.switchYouSendAndYouReceive(electronApp);
      await app.swap.checkAssetFrom(electronApp, swap.accountToCredit.currency.ticker);
      await app.swap.checkAssetTo(electronApp, swap.accountToDebit.currency.ticker);
    },
  );
});

const swapEntryPoint = {
  swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.0006"),
};

test.describe("Swap flow from different entry point", () => {
  setupEnv(true);

  const { accountToDebit, accountToCredit } = swapEntryPoint.swap;

  test.use({
    userdata: "skip-onboarding",
    speculosApp: app,

    cliCommandsOnApp: [
      [
        {
          app: accountToDebit.currency.speculosApp,
          cmd: liveDataCommand(accountToDebit.currency.speculosApp, accountToDebit.index),
        },
        {
          app: accountToCredit.currency.speculosApp,
          cmd: liveDataCommand(accountToCredit.currency.speculosApp, accountToCredit.index),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    "Entry Point - Portfolio page",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX"],
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
      tag: ["@NanoSP", "@LNS", "@NanoX"],
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
      tag: ["@NanoSP", "@LNS", "@NanoX"],
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
      tag: ["@NanoSP", "@LNS", "@NanoX"],
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
      tag: ["@NanoSP", "@LNS", "@NanoX"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2989",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(
        getParentAccountName(swapEntryPoint.swap.accountToDebit),
      );
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
      tag: ["@NanoSP", "@LNS", "@NanoX"],
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

const swapMax = [
  {
    fromAccount: Account.ETH_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-3365",
  },
  {
    fromAccount: TokenAccount.ETH_USDT_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-3366",
  },
];

for (const { fromAccount, toAccount, xrayTicket } of swapMax) {
  test.describe("Swap - Send Max", () => {
    setupEnv(true);

    const accPair: string[] = [fromAccount, toAccount].map(acc =>
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
      userdata: "skip-onboarding",
      speculosApp: app,

      cliCommandsOnApp: [
        [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataCommand(fromAccount.currency.speculosApp, fromAccount.index),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataCommand(toAccount.currency.speculosApp, toAccount.index),
          },
        ],
        { scope: "test" },
      ],
    });

    test(
      `Swap max amount from ${fromAccount.currency.name} to ${toAccount.currency.name}`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX"],
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

        await app.swap.selectAssetFrom(electronApp, fromAccount);
        await app.swapDrawer.selectAccountByName(fromAccount);
        await app.swap.selectAssetTo(electronApp, toAccount.currency.name);
        await app.swapDrawer.selectAccountByName(toAccount);

        await app.swap.clickSwapMax(electronApp);

        const amountToSend = await app.swap.getAmountToSend(electronApp);
        const selectedProvider = await app.swap.selectExchangeWithoutKyc(electronApp);
        const swap = new Swap(fromAccount, toAccount, amountToSend);

        await performSwapUntilDeviceVerificationStep(
          app,
          electronApp,
          swap,
          selectedProvider,
          amountToSend,
        );
        await app.speculos.verifyAmountsAndAcceptSwap(swap, amountToSend);
        await app.swapDrawer.verifyExchangeCompletedTextContent(swap.accountToCredit.currency.name);
      },
    );
  });
}

test.describe("Swap history", () => {
  const swapHistory = {
    swap: new Swap(Account.ETH_1, Account.XLM_1, "0.008"),
    xrayTicket: "B2CQA-604",
    provider: Provider.CHANGELLY,
    swapId: "fmwnt4mc0tiz75kz",
  };

  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [
      swapHistory.swap.accountToDebit,
      swapHistory.swap.accountToCredit,
    ].map(acc => acc.currency.speculosApp.name.replace(/ /g, "_"));
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    userdata: "speculos-tests-app",
    speculosApp: app,
  });

  test(
    `User can export all history operations`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX"],
      annotation: { type: "TMS", description: "B2CQA-604" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.layout.goToSwap();
      await app.swap.goToSwapHistory();

      await app.swap.clickExportOperations();
      await app.swap.checkExportedFileContents(
        swapHistory.swap,
        swapHistory.provider,
        swapHistory.swapId,
      );
    },
  );

  test(
    `User should be able to see their swap history from the swap history page`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX"],
      annotation: { type: "TMS", description: "B2CQA-602" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.layout.goToSwap();
      await app.swap.goToSwapHistory();
      await app.swap.checkSwapOperation(swapHistory.swapId, swapHistory.provider, swapHistory.swap);
      await app.swap.openSelectedOperation(swapHistory.swapId);
      await app.operationDrawer.expectSwapDrawerInfos(
        swapHistory.swapId,
        swapHistory.swap,
        swapHistory.provider,
      );
    },
  );
});
