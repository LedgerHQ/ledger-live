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
import { Provider } from "@ledgerhq/live-common/e2e/enum/Swap";
import { CLI } from "tests/utils/cliUtils";

function setupEnv(disableBroadcast?: boolean) {
  const originalBroadcastValue = process.env.DISABLE_TRANSACTION_BROADCAST;
  test.beforeAll(async () => {
    process.env.SWAP_DISABLE_APPS_INSTALL = "true";
    if (disableBroadcast) process.env.DISABLE_TRANSACTION_BROADCAST = "1";
  });
  test.afterAll(async () => {
    delete process.env.SWAP_DISABLE_APPS_INSTALL;
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
    url: "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
    xrayTicket: "B2CQA-2750, B2CQA-3135",
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.00067", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
    xrayTicket: "B2CQA-2744, B2CQA-2432",
  },
  {
    swap: new Swap(Account.ETH_USDT_1, Account.ETH_1, "40", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
    xrayTicket: "B2CQA-2752, B2CQA-2048",
  },
  {
    swap: new Swap(Account.ETH_1, Account.SOL_1, "0.03", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
    xrayTicket: "B2CQA-2748",
  },
  {
    swap: new Swap(Account.ETH_1, Account.ETH_USDT_1, "0.02", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
    xrayTicket: "B2CQA-2749",
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.SOL_1, "0.0006", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
    xrayTicket: "B2CQA-2747",
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_USDT_1, "0.0006", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
    xrayTicket: "B2CQA-2746",
  },
  {
    swap: new Swap(Account.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "40", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
    xrayTicket: "B2CQA-2753",
  },
  {
    swap: new Swap(Account.ETH_USDT_1, Account.SOL_1, "60", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
    xrayTicket: "B2CQA-2751",
  },
  {
    swap: new Swap(Account.SOL_1, Account.ETH_1, "0.3", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
    xrayTicket: "B2CQA-2775",
  },
  {
    swap: new Swap(Account.SOL_1, Account.BTC_NATIVE_SEGWIT_1, "0.3", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
    xrayTicket: "B2CQA-2776",
  },
  {
    swap: new Swap(Account.SOL_1, Account.ETH_USDT_1, "0.3", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
    xrayTicket: "B2CQA-2777",
  },
  {
    swap: new Swap(Account.ETH_USDC_1, Account.ETH_1, "65", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
    xrayTicket: "B2CQA-2830",
  },
  {
    swap: new Swap(Account.ETH_USDC_1, Account.SOL_1, "45", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
    xrayTicket: "B2CQA-2831",
  },
  {
    swap: new Swap(Account.ETH_USDC_1, Account.BTC_NATIVE_SEGWIT_1, "65", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
    xrayTicket: "B2CQA-2832",
  },
  {
    swap: new Swap(Account.ETH_1, Account.DOT_1, "0.03", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
    xrayTicket: "B2CQA-3017",
  },
  {
    swap: new Swap(Account.XRP_1, Account.ETH_USDC_1, "20", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
    xrayTicket: "B2CQA-3075",
  },
  {
    swap: new Swap(Account.ETH_1, Account.XRP_1, "0.03", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/",
    xrayTicket: "B2CQA-3076",
  },
  {
    swap: new Swap(Account.XRP_1, Account.BTC_NATIVE_SEGWIT_1, "20", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
    xrayTicket: "B2CQA-3077",
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.LTC_1, "0.0006", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
    xrayTicket: "B2CQA-3078",
  },
  {
    swap: new Swap(Account.APTOS_1, Account.BTC_NATIVE_SEGWIT_1, "15", Fee.MEDIUM),
    url: "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
    xrayTicket: "B2CQA-3081",
  },
];

for (const { swap, xrayTicket, url } of swaps) {
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
      userdata: "skip-onboarding",
      speculosApp: app,
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

        await performSwapUntilQuoteSelectionStep(app, electronApp, swap, url);
        const selectedProvider = await app.swap.selectExchange(electronApp);

        await performSwapUntilDeviceVerificationStep(app, electronApp, swap, selectedProvider);
        await app.speculos.verifyAmountsAndAcceptSwap(swap);
        await app.swapDrawer.verifyExchangeCompletedTextContent(swap.accountToCredit.currency.name);
      },
    );
  });
}

const checkProviders = [
  {
    swap: new Swap(Account.ETH_1, Account.ETH_USDT_1, "0.03", Fee.MEDIUM),
    xrayTicket: "B2CQA-3120",
    provider: Provider.ONE_INCH,
  },
  {
    swap: new Swap(Account.ETH_1, Account.ETH_USDT_1, "0.03", Fee.MEDIUM),
    xrayTicket: "B2CQA-3119",
    provider: Provider.PARASWAP,
  },
];

for (const { swap, xrayTicket, provider } of checkProviders) {
  test.describe("Swap - Provider redirection", () => {
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
      userdata: "skip-onboarding",
      speculosApp: app,
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

    test(
      `Swap test provider redirection (${provider.uiName})`,
      {
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        const url = "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/";
        await performSwapUntilQuoteSelectionStep(app, electronApp, swap, url);
        await app.swap.selectSpecificprovider(provider.uiName, electronApp);
        await app.swap.goToProviderLiveApp(electronApp, provider.uiName);
        await app.swap.verifyProviderURL(electronApp, provider.uiName, swap);
        await app.liveApp.verifyLiveAppTitle(provider.uiName.toLowerCase());
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
    userdata: "skip-onboarding",
    speculosApp: app,
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

  test(
    `Swap ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name} - Check "Best Offer"`,
    {
      annotation: { type: "TMS", description: "B2CQA-2327" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees";
      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, url);
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
    userdata: "skip-onboarding",
    speculosApp: app,
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

  test(
    `Swap ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name} - Default currency`,
    {
      annotation: { type: "TMS", description: "B2CQA-3079" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees";
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap(), url);
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

      const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees";
      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, url);
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
    userdata: "skip-onboarding",
    speculosApp: app,
    cliCommandsOnApp: [
      {
        app: rejectedSwap.accountToDebit.currency.speculosApp,
        cmd: (userdataPath?: string) => {
          return CLI.liveData({
            currency: rejectedSwap.accountToDebit.currency.speculosApp.name,
            index: rejectedSwap.accountToDebit.index,
            add: true,
            appjson: userdataPath,
          });
        },
      },
      {
        app: rejectedSwap.accountToCredit.currency.speculosApp,
        cmd: (userdataPath?: string) => {
          return CLI.liveData({
            currency: rejectedSwap.accountToCredit.currency.speculosApp.name,
            index: rejectedSwap.accountToCredit.index,
            add: true,
            appjson: userdataPath,
          });
        },
      },
    ],
  });

  test(
    `Swap ${rejectedSwap.accountToDebit.currency.name} to ${rejectedSwap.accountToCredit.currency.name}`,
    {
      annotation: { type: "TMS", description: "B2CQA-2212" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees";
      await performSwapUntilQuoteSelectionStep(app, electronApp, rejectedSwap, url);
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

test.describe("Swap - Landing page", () => {
  const rejectedSwap = new Swap(Account.ETH_1, Account.ETH_USDC_1, "0.03", Fee.MEDIUM);
  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [rejectedSwap.accountToDebit, rejectedSwap.accountToCredit].map(
      acc => acc.currency.speculosApp.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    userdata: "skip-onboarding",
    speculosApp: app,
    cliCommandsOnApp: [
      {
        app: rejectedSwap.accountToDebit.currency.speculosApp,
        cmd: (userdataPath?: string) => {
          return CLI.liveData({
            currency: rejectedSwap.accountToDebit.currency.speculosApp.name,
            index: rejectedSwap.accountToDebit.index,
            add: true,
            appjson: userdataPath,
          });
        },
      },
      {
        app: rejectedSwap.accountToCredit.currency.speculosApp,
        cmd: (userdataPath?: string) => {
          return CLI.liveData({
            currency: rejectedSwap.accountToCredit.currency.speculosApp.name,
            index: rejectedSwap.accountToCredit.index,
            add: true,
            appjson: userdataPath,
          });
        },
      },
    ],
  });

  test(
    `Swap landing page`,
    {
      annotation: { type: "TMS", description: "B2CQA-2918" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const url = "https://explorers.api.live.ledger.com/blockchain/v4/eth/gastracker/";
      await performSwapUntilQuoteSelectionStep(app, electronApp, rejectedSwap, url);
      const providerList = await app.swap.getProviderList(electronApp);
      await app.swap.checkQuotesContainerInfos(electronApp, providerList);
      await app.swap.checkBestOffer(electronApp);
    },
  );
});

const swapWithDifferentSeed = [
  {
    swap: new Swap(Account.ETH_1, Account.SOL_1, "0.03", Fee.MEDIUM),
    xrayTicket: "B2CQA-3089",
    userData: "speculos-x-other-account",
    errorMessage:
      "This receiving account does not belong to the device you have connected. Please change and retry",
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.002", Fee.MEDIUM),
    xrayTicket: "B2CQA-3090",
    userData: "speculos-x-other-account",
    errorMessage:
      "This receiving account does not belong to the device you have connected. Please change and retry",
  },
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.03", Fee.MEDIUM),
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
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await performSwapUntilQuoteSelectionStep(app, electronApp, swap);
        const selectedProvider = await app.swap.selectExchange(electronApp);

        await app.swap.clickExchangeButton(electronApp, selectedProvider);

        await app.swapDrawer.checkErrorMessage(errorMessage);
      },
    );
  });
}

const tooLowAmountForQuoteSwaps = [
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "1", Fee.MEDIUM),
    xrayTicket: "B2CQA-3239, B2CQA-3136",
    errorMessage: "Not enough balance, including network fee",
    ctaBanner: true,
    quotesVisible: true,
  },
  {
    swap: new Swap(Account.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "200", Fee.MEDIUM),
    xrayTicket: "B2CQA-3240",
    errorMessage: "Not enough balance",
    ctaBanner: false,
    quotesVisible: true,
  },
  {
    swap: new Swap(Account.ETH_USDT_2, Account.BTC_NATIVE_SEGWIT_1, "20", Fee.MEDIUM),
    xrayTicket: "B2CQA-3241",
    errorMessage: new RegExp(`\\d+(\\.\\d{1,10})? ETH needed for network fees\\.\\s*$`),
    ctaBanner: true,
    quotesVisible: true,
  },
  {
    swap: new Swap(Account.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "0.000001", Fee.MEDIUM),
    xrayTicket: "B2CQA-3242",
    errorMessage: new RegExp(`Minimum \\d+(\\.\\d{1,10})? USDT needed for quotes\\.\\s*$`),
    ctaBanner: false,
    quotesVisible: false,
  },
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "10000", Fee.MEDIUM),
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
        {
          app: swap.swap.accountToDebit.currency.speculosApp,
          cmd: (userdataPath?: string) => {
            return CLI.liveData({
              currency: swap.swap.accountToDebit.currency.speculosApp.name,
              index: swap.swap.accountToDebit.index,
              add: true,
              appjson: userdataPath,
            });
          },
        },
        {
          app: swap.swap.accountToCredit.currency.speculosApp,
          cmd: (userdataPath?: string) => {
            return CLI.liveData({
              currency: swap.swap.accountToCredit.currency.speculosApp.name,
              index: swap.swap.accountToCredit.index,
              add: true,
              appjson: userdataPath,
            });
          },
        },
      ],
    });

    test(
      `Swap too low quote amounts from ${swap.swap.accountToDebit.currency.name} to ${swap.swap.accountToCredit.currency.name} - ${swap.errorMessage}`,
      {
        annotation: {
          type: "TMS",
          description: swap.xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees";
        await performSwapUntilQuoteSelectionStep(app, electronApp, swap.swap, url);
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

const swapEntryPoint = {
  swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.0006", Fee.MEDIUM),
};

test.describe("Swap flow from different entry point", () => {
  setupEnv(true);

  test.use({
    userdata: "skip-onboarding",
    speculosApp: app,
    cliCommandsOnApp: [
      {
        app: swapEntryPoint.swap.accountToDebit.currency.speculosApp,
        cmd: (userdataPath?: string) => {
          return CLI.liveData({
            currency: swapEntryPoint.swap.accountToDebit.currency.speculosApp.name,
            index: swapEntryPoint.swap.accountToDebit.index,
            add: true,
            appjson: userdataPath,
          });
        },
      },
      {
        app: swapEntryPoint.swap.accountToCredit.currency.speculosApp,
        cmd: (userdataPath?: string) => {
          return CLI.liveData({
            currency: swapEntryPoint.swap.accountToCredit.currency.speculosApp.name,
            index: swapEntryPoint.swap.accountToCredit.index,
            add: true,
            appjson: userdataPath,
          });
        },
      },
    ],
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
      const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees";
      await app.swap.goAndWaitForSwapToBeReady(() => app.portfolio.clickSwapButton(), url);
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
      const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees";
      await app.swap.goAndWaitForSwapToBeReady(() => app.assetPage.startSwapFlow(), url);
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
      const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees";
      await app.swap.goAndWaitForSwapToBeReady(
        () =>
          app.market.startSwapForSelectedTicker(swapEntryPoint.swap.accountToDebit.currency.ticker),
        url,
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
      const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees";
      await app.swap.goAndWaitForSwapToBeReady(() => app.market.clickOnSwapButtonOnAsset(), url);
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
      const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees";
      await app.swap.goAndWaitForSwapToBeReady(() => app.account.navigateToSwap(), url);
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
      const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees";
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap(), url);
      await app.swap.expectSelectedAssetDisplayed("BTC", electronApp);
    },
  );
});

async function performSwapUntilQuoteSelectionStep(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
  url?: string,
) {
  await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap(), url);

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
