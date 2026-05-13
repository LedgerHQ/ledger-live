import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import {
  setupEnv,
  performSwapUntilQuoteSelectionStep,
  revokeTokenApproval,
} from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";

const xrayTicket = "B2CQA-5632";
const fromAccount = TokenAccount.ETH_USDC_1;
const toAccount = Account.ETH_1;
const eligibleProviders = [
  { provider: Provider.THORCHAIN },
  { provider: Provider.UNISWAP },
  { provider: Provider.LIFI },
  { provider: Provider.OKX },
  // { provider: Provider.ONE_INCH },
  // { provider: Provider.VELORA },
];
const seed = Math.floor(Date.now() / 60_000);
const randomizedSeed = Math.abs(Math.sin(seed + 1));
const { provider } = eligibleProviders[Math.floor(randomizedSeed * eligibleProviders.length)];

test.describe(`Token approval - ${provider.uiName} flow`, () => {
  test.skip(
    process.env.DISABLE_TRANSACTION_BROADCAST !== "0",
    "Token approval flow requires broadcast to be enabled — runs on Monday nightly only",
  );

  setupEnv(false);

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: provider.app ?? fromAccount.currency.speculosApp,

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
    `Swap - ${provider.uiName} approval flow`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
      annotation: [
        {
          type: "TMS",
          description: xrayTicket,
        },
      ],
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await revokeTokenApproval(fromAccount, provider);
      await app.swap.ensureRevokeTokenApproval(fromAccount, provider);
      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount, provider);
      await performSwapUntilQuoteSelectionStep(app, swap, minAmount);
      await app.swap.selectSpecificProvider(provider);
      await app.swap.clickExchangeButton(provider.name);
      await app.swap.expectTwoStepApprovalScreen();
      await app.swap.clickGiveApprovalButton();
      await app.swap.clickContinueButton();
      await app.speculos.signTokenApproval();
      if (provider === Provider.UNISWAP) {
        await app.swap.clickGiveAuthorizationButton();
        await app.speculos.signTypedMessage();
      }
      await app.swap.expectTwoStepSignScreen();
    },
  );
});
