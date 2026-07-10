import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-e2e-shared/speculos";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";

const app: AppInfos = AppInfos.EXCHANGE;

type TooLowAmountSwap = {
  swap: Swap;
  xrayTicket: string;
  errorMessage: string;
  quotesVisible: boolean;
  errorDisplay: "banner" | "quotesPlaceholder";
};

// LedgerHQ/swap-live-app#1699 removed the insufficient-funds CTA banner from the Lumen desktop form.
const tooLowAmountForQuoteSwaps: TooLowAmountSwap[] = [
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "1"),
    xrayTicket: "B2CQA-3239, B2CQA-3136",
    errorMessage: "Insufficient balance",
    quotesVisible: true,
    errorDisplay: "banner",
  },
  {
    swap: new Swap(TokenAccount.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "200"),
    xrayTicket: "B2CQA-3240",
    errorMessage: "Insufficient balance",
    quotesVisible: true,
    errorDisplay: "banner",
  },

  {
    swap: new Swap(TokenAccount.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "0.000001"),
    xrayTicket: "B2CQA-3242",
    errorMessage: "No quotes to show, yet",
    quotesVisible: false,
    errorDisplay: "quotesPlaceholder",
  },
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "10000"),
    xrayTicket: "B2CQA-3243",
    errorMessage: "Insufficient balance",
    quotesVisible: false,
    errorDisplay: "banner",
  },
];

for (const swap of tooLowAmountForQuoteSwaps) {
  test.describe(`Swap - with too low amount (throwing UI errors) - ${swap.swap.amount} ${swap.swap.accountToDebit.currency.name} to ${swap.swap.accountToCredit.currency.name}`, () => {
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
      teamOwner: Team.SWAP,
      userdata: "skip-onboarding-with-last-seen-device",
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
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        const swapAmount =
          swap.swap.amount === "USE_MIN_AMOUNT"
            ? await app.swap.getMinimumAmount(accountToDebit, accountToCredit)
            : (swap.swap.amount ?? "0");

        await performSwapUntilQuoteSelectionStep(app, swap.swap, swapAmount);
        if (swap.quotesVisible) {
          await app.swap.checkQuotes();
          await app.swap.selectExchange();
        }
        await app.swap.verifySwapErrorMessageIsCorrect(swap.errorMessage, swap.errorDisplay);
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

// Unreachable while ptxSponsoredTransactions covers this pair — see B2CQA-3241.
const swapEthNeededForNetworkFeesTestConfig = {
  swap: new Swap(TokenAccount.ETH_USDT_2, Account.BTC_NATIVE_SEGWIT_1, "USE_MIN_AMOUNT"),
  errorMessage: new RegExp(`\\d+(\\.\\d{1,10})? ETH needed for network fees\\.\\s*$`),
  xrayTicket: "B2CQA-3241",
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
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
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

  // Enable test when "Sponsored" program is over
  test.skip(
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
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      const minAmount = await app.swap.getMinimumAmount(accountToDebit, accountToCredit);

      await performSwapUntilQuoteSelectionStep(
        app,
        swapNetworkFeesAboveAccountBalanceTestConfig.swap,
        minAmount,
      );
      await app.swap.checkQuotes();
      await app.swap.selectExchange();
      await app.swap.checkFeeErrorMessage(
        swapNetworkFeesAboveAccountBalanceTestConfig.errorMessage,
      );
    },
  );

  // Enable once ptxSponsoredTransactions no longer covers this provider/chain pair.
  test.skip(
    `Swap too low quote amounts from ${swapEthNeededForNetworkFeesTestConfig.swap.accountToDebit.currency.name} to ${swapEthNeededForNetworkFeesTestConfig.swap.accountToCredit.currency.name} - ETH needed for network fees`,
    {
      tag: swapEthNeededForNetworkFeesTestConfig.tags,
      annotation: {
        type: "TMS",
        description: swapEthNeededForNetworkFeesTestConfig.xrayTicket,
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      const minAmount = await app.swap.getMinimumAmount(accountToDebit, accountToCredit);

      await performSwapUntilQuoteSelectionStep(
        app,
        swapEthNeededForNetworkFeesTestConfig.swap,
        minAmount,
      );
      await app.swap.checkQuotes();
      await app.swap.selectExchange();
      await app.swap.checkFeeErrorMessage(swapEthNeededForNetworkFeesTestConfig.errorMessage);
    },
  );
});
