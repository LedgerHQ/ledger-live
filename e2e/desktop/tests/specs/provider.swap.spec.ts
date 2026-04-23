import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";

const app: AppInfos = AppInfos.ETHEREUM;

const providerFlowTests = [
  {
    fromAccount: Account.ETH_1,
    toAccount: TokenAccount.ETH_USDC_1,
    provider: Provider.ONE_INCH,
    xrayTicket: "B2CQA-3120",
  },
  {
    fromAccount: TokenAccount.ETH_USDT_1,
    toAccount: Account.ETH_1,
    provider: Provider.OKX,
    xrayTicket: "B2CQA-4728",
  },
];

for (const { fromAccount, toAccount, provider, xrayTicket } of providerFlowTests) {
  test.describe(`Swap - ${provider.uiName} flow`, () => {
    setupEnv(true);

    test.use({
      teamOwner: Team.SWAP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: provider.app,

      cliCommandsOnApp: [
        [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(fromAccount),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(toAccount),
          },
        ],
        { scope: "test" },
      ],
    });

    test(
      `Swap - ${provider.uiName} flow`,
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
        ],
        annotation: [
          {
            type: "TMS",
            description: xrayTicket,
          },
        ],
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
        await app.swap.ensureTokenApproval(fromAccount, provider, minAmount);
        const swap = new Swap(fromAccount, toAccount, minAmount, provider);

        await performSwapUntilQuoteSelectionStep(app, swap, minAmount);
        await app.swap.selectSpecificProvider(provider);

        await app.swap.clickExchangeButton();
        await app.swap.checkElementsPresenceOnSwapApprovalStep();
        await app.swap.clickExecuteSwapButton();
        await app.swap.clickContinueButton();
        await app.speculos.verifyAmountsAndAcceptSwap(swap, minAmount);
        await app.swap.expectTransactionSentToasterToBeVisible();
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
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: app,

    cliCommandsOnApp: [
      [
        {
          app: fromAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(fromAccount),
        },
        {
          app: toAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(toAccount),
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
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, swap, minAmount);
      await app.swap.selectExchangeWithoutKyc();
      await app.swap.checkBestOffer();
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
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: app,

    cliCommandsOnApp: [
      [
        {
          app: fromAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(fromAccount),
        },
        {
          app: toAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(toAccount),
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
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);

      if (!minAmount) {
        throw new Error("Test failed: No quotes retrieved from swap API.");
      }

      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, swap, minAmount);
      const providerList = await app.swap.getProviderList();
      await app.swap.checkQuotesContainerInfos(providerList, toAccount.currency.ticker);
      await app.swap.checkBestOffer();
    },
  );
});
