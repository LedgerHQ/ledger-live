import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import test from "tests/fixtures/common";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { performSwapUntilQuoteSelectionStep, setupEnv } from "tests/utils/swapUtils";
import { keepRunningProviders } from "@ledgerhq/live-e2e-shared/swap";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";

const dexProviders = [
  SwapProvider.ONE_INCH,
  SwapProvider.VELORA,
  SwapProvider.UNISWAP,
  SwapProvider.OKX,
];
const fromAccount = TokenAccount.ETH_USDT_1;
const toAccount = Account.ETH_3;

test.describe("Swap cross account warning", () => {
  setupEnv();

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",

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

  for (const provider of dexProviders) {
    test(
      `A warning should be visible for a cross account swap with ${provider.uiName}`,
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
            description: "LIVE-19543",
          },
        ],
      },
      async ({ app }) => {
        const healthyProviders = await keepRunningProviders([provider], fromAccount, toAccount);
        test.skip(
          healthyProviders.length === 0,
          `${provider.uiName} provider is currently down — skipping cross-account warning check`,
        );

        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
        const swap = new Swap(fromAccount, toAccount, minAmount, provider);
        const errorMessage =
          "Cross-account swaps are not currently supported. Please ensure your sending and receiving accounts are the same.";
        await performSwapUntilQuoteSelectionStep(app, swap, minAmount);
        await app.swap.selectSpecificProvider(provider);
        await app.swap.verifySwapCrossAccountErrorMessageIsCorrect(errorMessage);
      },
    );
  }
});
