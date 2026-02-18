import test from "tests/fixtures/common";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "tests/utils/cliCommandsUtils";

const app: AppInfos = AppInfos.EXCHANGE;

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
            cmd: liveDataWithAddressCommand(accountToDebit),
          },
          {
            app: accountToCredit.currency.speculosApp,
            cmd: liveDataWithAddressCommand(accountToCredit),
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
    `Your account .+ doesn't have enough balance to cover the network fees\\.`,
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
          cmd: liveDataWithAddressCommand(accountToDebit),
        },
        {
          app: accountToCredit.currency.speculosApp,
          cmd: liveDataWithAddressCommand(accountToCredit),
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
      await app.swap.checkFeeErrorMessage(
        electronApp,
        swapNetworkFeesAboveAccountBalanceTestConfig.errorMessage,
      );
    },
  );
});
