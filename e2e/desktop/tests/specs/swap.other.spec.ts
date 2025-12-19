import test from "tests/fixtures/common";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { CLI } from "tests/utils/cliUtils";
import {
  setupEnv,
  performSwapUntilQuoteSelectionStep,
  handleSwapErrorOrSuccess,
  selectAccountMAD,
} from "tests/utils/swapUtils";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getEnv } from "@ledgerhq/live-env";
import { overrideNetworkPayload } from "tests/utils/networkUtils";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";

const app: AppInfos = AppInfos.EXCHANGE;

const liveDataCommand = (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
  CLI.liveData({
    currency: currencyApp.name,
    index,
    add: true,
    appjson: userdataPath,
  });

test.describe("Swap - Provider redirection", () => {
  const fromAccount = Account.ETH_1;
  const toAccount = TokenAccount.ETH_USDC_1;
  const provider = Provider.VELORA;
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
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
      annotation: {
        type: "TMS",
        description: "B2CQA-3119",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);

      await app.swap.selectSpecificProvider(provider, electronApp);
      await app.swap.goToProviderLiveApp(electronApp, provider.uiName);
      await app.swap.verifyProviderURL(electronApp, provider.uiName, swap);
      await app.liveApp.verifyLiveAppTitle(provider.uiName.toLowerCase());
    },
  );
});

test.describe("Swap - 1inch flow", () => {
  const fromAccount = Account.ETH_1;
  const toAccount = TokenAccount.ETH_USDT_1;
  const provider = Provider.ONE_INCH;
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
    `Swap test 1inch flow (${provider.uiName})`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
      annotation: {
        type: "TMS",
        description: "B2CQA-3120",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);

      await app.swap.selectSpecificProvider(provider, electronApp);
      await app.swap.clickExchangeButton(electronApp);
      await app.swap.checkElementsPresenceOnSwapApprovalStep(electronApp);
      await app.swap.clickExecuteSwapButton(electronApp);
      await app.swap.clickContinueButton();
      //TODO: when B2CA-2384 is fixed the flow could be finished
    },
  );
});

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
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
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
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
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
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
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
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: { type: "TMS", description: "B2CQA-2212" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const rejectedSwap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, rejectedSwap, minAmount);
      await app.swap.selectExchangeWithoutKyc(electronApp);

      await app.swap.clickExchangeButton(electronApp);
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
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
      annotation: { type: "TMS", description: "B2CQA-2918" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);

      if (!minAmount) {
        throw new Error("Test failed: No quotes retrieved from swap API.");
      }

      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);
      const providerList = await app.swap.getProviderList(electronApp);
      await app.swap.checkQuotesContainerInfos(
        electronApp,
        providerList,
        toAccount.currency.ticker,
      );
      await app.swap.checkBestOffer(electronApp);
    },
  );
});

interface SwapTestCase {
  swap: Swap;
  xrayTicket: string;
  errorMessage?: string | null;
  expectedErrorPerDevice?: {
    [deviceId: string]: string;
  };
}

const swapWithDifferentSeed: SwapTestCase[] = [
  {
    swap: new Swap(Account.ETH_1, Account.SOL_1, "0.03"),
    xrayTicket: "B2CQA-3089",
    errorMessage:
      "This sending account does not belong to the device you have connected. Please change and retry",
    expectedErrorPerDevice: {
      [DeviceModelId.nanoS]:
        "This receiving account does not belong to the device you have connected. Please change and retry",
    },
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.002"),
    xrayTicket: "B2CQA-3090",
    errorMessage: null,
  },
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.03"),
    xrayTicket: "B2CQA-3091",
    errorMessage:
      "This sending account does not belong to the device you have connected. Please change and retry",
    expectedErrorPerDevice: {
      [DeviceModelId.nanoS]:
        "This sending account does not belong to the device you have connected. Please change and retry",
    },
  },
];

for (const { swap, xrayTicket, errorMessage, expectedErrorPerDevice } of swapWithDifferentSeed) {
  test.describe("Swap - Using different seed", () => {
    setupEnv(true);

    test.use({
      userdata: "speculos-x-other-account",
      speculosApp: app,
    });

    const familyDebit = getFamilyByCurrencyId(swap.accountToDebit.currency.id);
    const familyCredit = getFamilyByCurrencyId(swap.accountToCredit.currency.id);

    test.beforeEach(async () => {
      const accountPair = [swap.accountToDebit, swap.accountToCredit].map(acc =>
        acc.currency.speculosApp.name.replaceAll(" ", "_"),
      );
      setExchangeDependencies(accountPair.map(name => ({ name })));
    });

    test(
      `Swap using a different seed - ${swap.accountToDebit.currency.name} → ${swap.accountToCredit.currency.name}`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          `@${swap.accountToDebit.currency.id}`,
          ...(familyDebit ? [`@family-${familyDebit}`] : []),
          `@${swap.accountToCredit.currency.id}`,
          ...(familyCredit ? [`@family-${familyCredit}`] : []),
        ],
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app, electronApp }) => {
        const tmsDescription = getDescription(test.info().annotations, "TMS");
        await addTmsLink(tmsDescription.split(", "));

        const minAmount = await app.swap.getMinimumAmount(
          swap.accountToDebit,
          swap.accountToCredit,
        );

        await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);

        await handleSwapErrorOrSuccess(
          app,
          electronApp,
          swap,
          minAmount,
          errorMessage ?? null,
          expectedErrorPerDevice,
        );
      },
    );
  });
}

test.describe("Swap a coin for which you have no account yet", () => {
  setupEnv(true);
  const account1 = Account.BTC_NATIVE_SEGWIT_1;
  const account2 = Account.ETH_1;
  const xrayTicket = "B2CQA-3353";

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
    "from Account present to Account not present",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

      await app.swap.selectFromAccountCoinSelector(electronApp);

      const isModularDrawer = await app.modularDrawer.isModularAssetsDrawerVisible();
      if (isModularDrawer) {
        await selectAccountMAD(app, account1);

        await app.swap.selectToAccountCoinSelector(electronApp);
        await app.modularDrawer.selectAssetByTickerAndName(account2.currency);
        await app.modularDrawer.selectNetwork(account2.currency);
        await app.modularDrawer.clickOnAddAndExistingAccountButton();

        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickContinueButton();
      } else {
        await app.swap.selectAssetFrom(electronApp, account1.currency.name);
        await app.swapDrawer.selectAccountByName(account1);

        await app.swap.selectAssetTo(electronApp, account2.currency.name);
        await app.swapDrawer.clickOnAddAccountButton();

        await app.addAccount.addAccounts();
        await app.addAccount.done();
        await app.swapDrawer.selectAccountByName(account2);
      }
      await app.swap.checkAssetFrom(electronApp, account1.currency.name);
      await app.swap.checkAssetTo(electronApp, account2.currency.name);
    },
  );
});

test.describe("Swap a coin for which you have no account yet", () => {
  setupEnv(true);
  const account1 = Account.ETH_1;
  const account2 = Account.BTC_NATIVE_SEGWIT_1;
  const xrayTicket = "B2CQA-3354";

  test.use({
    userdata: "skip-onboarding",
    speculosApp: account1.currency.speculosApp,
    cliCommandsOnApp: [
      [
        {
          app: account2.currency.speculosApp,
          cmd: liveDataCommand(account2.currency.speculosApp, account2.index),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    "from Account not present to Account present",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

      await app.swap.selectFromAccountCoinSelector(electronApp);
      const isModularDrawer = await app.modularDrawer.isModularAssetsDrawerVisible();
      if (isModularDrawer) {
        await app.modularDrawer.selectAssetByTickerAndName(account1.currency);
        await app.modularDrawer.selectNetwork(account1.currency);
        await app.modularDrawer.clickOnAddAndExistingAccountButton();

        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickContinueButton();

        await app.swap.selectToAccountCoinSelector(electronApp);
        await selectAccountMAD(app, account2);
      } else {
        await app.swap.selectAssetFrom(electronApp, account1.currency.name);
        await app.swapDrawer.clickOnAddAccountButton();

        await app.addAccount.addAccounts();
        await app.addAccount.done();
        await app.swapDrawer.selectAccountByName(account1);

        await app.swap.selectAssetTo(electronApp, account2.currency.name);
        await app.swapDrawer.selectAccountByName(account2);
      }
      await app.swap.checkAssetFrom(electronApp, account1.currency.name);
      await app.swap.checkAssetTo(electronApp, account2.currency.name);
    },
  );
});

test.describe("Swap a coin for which you have no account yet", () => {
  const account1 = Account.ETH_1;
  const account2 = Account.BSC_1;
  const xrayTicket = "B2CQA-3355, B2CQA-3282, B2CQA-3288";

  setupEnv(true);

  test.use({
    userdata: "1AccountDOT",
    speculosApp: account2.currency.speculosApp,
  });

  test(
    "from Account not present to Account not present",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bsc",
      ],
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

      await app.swap.selectFromAccountCoinSelector(electronApp);

      await app.modularDrawer.selectAssetByTickerAndName(account1.currency);
      await app.modularDrawer.selectNetwork(account1.currency);
      await app.modularDrawer.clickOnAddAndExistingAccountButton();

      await app.scanAccountsDrawer.selectFirstAccount();
      await app.scanAccountsDrawer.clickContinueButton();

      await app.swap.selectToAccountCoinSelector(electronApp);
      await app.modularDrawer.selectAssetByTickerAndName(account2.currency);
      await app.modularDrawer.selectNetwork(account2.currency);
      await app.modularDrawer.clickOnAddAndExistingAccountButton();

      await app.scanAccountsDrawer.selectFirstAccount();
      await app.scanAccountsDrawer.clickContinueButton();
      await app.swap.checkAssetFrom(electronApp, account1.currency.name);
      await app.swap.checkAssetTo(electronApp, account2.currency.name);
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
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          "@ethereum",
          "@family-evm",
          "@bitcoin",
          "@family-bitcoin",
        ],
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

const swapNetworkFeesAboveAccountBalanceTestConfig = {
  swap: new Swap(TokenAccount.ETH_USDT_2, Account.BTC_NATIVE_SEGWIT_1, ""),
  errorMessage: new RegExp(
    `You need \\d+\\.\\d+ ETH in your account to pay for transaction fees on the Ethereum network. {2}Buy ETH or deposit more into your account. Learn more`,
  ),
  xrayTicket: "B2CQA-2363",
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
    "@bitcoin",
    "@family-bitcoin",
  ],
};

test.describe(`Swap - Error message when network fees are above account balance (${swapNetworkFeesAboveAccountBalanceTestConfig.swap.accountToDebit.currency.name} to ${swapNetworkFeesAboveAccountBalanceTestConfig.swap.accountToCredit.currency.name})`, () => {
  setupEnv(true);

  const accPair: string[] = [
    swapNetworkFeesAboveAccountBalanceTestConfig.swap.accountToDebit,
    swapNetworkFeesAboveAccountBalanceTestConfig.swap.accountToCredit,
  ].map(acc => acc.currency.speculosApp.name.replace(/ /g, "_"));

  const { accountToDebit, accountToCredit } = swapNetworkFeesAboveAccountBalanceTestConfig.swap;

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
    `Swap - Network fees above account balance`,
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: {
        type: "TMS",
        description: swapNetworkFeesAboveAccountBalanceTestConfig.xrayTicket,
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      const minAmount = await app.swap.getMinimumAmount(accountToDebit, accountToCredit);

      await performSwapUntilQuoteSelectionStep(
        app,
        electronApp,
        swapNetworkFeesAboveAccountBalanceTestConfig.swap,
        minAmount,
      );
      await app.swap.checkQuotes(electronApp);
      await app.swap.selectExchange(electronApp);
      await app.swap.tapQuoteInfosFeesSelector(electronApp);
      await app.swap.checkFeeDrawerErrorMessage(
        swapNetworkFeesAboveAccountBalanceTestConfig.errorMessage,
      );
    },
  );
});

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
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
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
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
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
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
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
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.currency.name);
    },
  );

  test(
    "Entry Point - Market page - Click on swap for any coin",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
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
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.currency.name);
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.accountName);
    },
  );

  test(
    "Entry Point - Market page - More than one account for an asset",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
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
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.currency.name);
    },
  );

  test(
    "Entry Point - Account page",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
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
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.currency.name);
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.accountName);
    },
  );

  test(
    "Entry Point - left menu",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
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
    xrayTicket: "B2CQA-3365, B2CQA-3450, B2CQA-3281",
  },
  {
    fromAccount: TokenAccount.ETH_USDT_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-3366, B2CQA-3450, B2CQA-3281",
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
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          "@ethereum",
          "@family-evm",
          "@bitcoin",
          "@family-bitcoin",
        ],
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

        await app.swap.selectFromAccountCoinSelector(electronApp);

        const isModularDrawer = await app.modularDrawer.isModularAssetsDrawerVisible();
        if (isModularDrawer) {
          await app.modularDrawer.selectAssetByTickerAndName(fromAccount.currency);
          await app.modularDrawer.selectNetwork(fromAccount.currency);
          await app.modularDrawer.selectAccountByName(fromAccount);

          await app.swap.selectToAccountCoinSelector(electronApp);
          await app.modularDrawer.selectAssetByTickerAndName(toAccount.currency);
          await app.modularDrawer.selectNetwork(toAccount.currency);
          await app.modularDrawer.selectAccountByName(toAccount);
        } else {
          const networkName = fromAccount.parentAccount?.currency.name;
          await app.swap.selectAsset(fromAccount.currency.name, networkName);
          await app.swapDrawer.selectAccountByName(fromAccount);
          await app.swap.selectAssetTo(electronApp, toAccount.currency.name);
          await app.swapDrawer.selectAccountByName(toAccount);
        }

        await app.swap.clickSwapMax(electronApp);

        const amountToSend = await app.swap.getAmountToSend(electronApp);
        await app.swap.selectExchangeWithoutKyc(electronApp);
        const swap = new Swap(fromAccount, toAccount, amountToSend);

        await app.swap.clickExchangeButton(electronApp);
        await app.speculos.verifyAmountsAndAcceptSwap(swap, amountToSend);
        await app.swapDrawer.verifyExchangeCompletedTextContent(swap.accountToCredit.currency.name);
      },
    );
  });
}

test.describe("Swap history", () => {
  const swapHistory = {
    swap: new Swap(Account.SOL_1, Account.ETH_1, "0.07"),
    xrayTicket: "B2CQA-604",
    provider: Provider.EXODUS,
    swapId: "wQ90NrWdvJz5dA4",
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
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@solana",
        "@family-solana",
        "@ethereum",
        "@family-evm",
      ],
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
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@solana",
        "@family-solana",
        "@ethereum",
        "@family-evm",
      ],
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

test.describe("Swap - Block blacklisted addresses", () => {
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
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: {
        type: "TMS",
        description: "B2CQA-3655",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const sanctionedAddressUrl = getEnv("SANCTIONED_ADDRESSES_URL");
      await overrideNetworkPayload(app, sanctionedAddressUrl, (json: any) => {
        json.bannedAddresses = [fromAccount.address];
        return json;
      });

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);
      await app.swap.selectExchangeWithoutKyc(electronApp);
      await app.swap.clickExchangeButton(electronApp);

      await app.swapDrawer.checkErrorMessage(
        `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${fromAccount.address}`,
      );
    },
  );
});
