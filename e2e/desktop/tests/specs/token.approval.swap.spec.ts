import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import {
  setupEnv,
  performSwapUntilQuoteSelectionStep,
  revokeTokenApproval,
} from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";
import { pickRotatingProvider } from "@ledgerhq/live-e2e-shared/swap";

const xrayTicket = "B2CQA-5632";
const fromAccount = TokenAccount.ETH_USDC_1;
const toAccount = Account.ETH_1;
const eligibleProviders = [
  SwapProvider.THORCHAIN,
  SwapProvider.UNISWAP,
  SwapProvider.LIFI,
  SwapProvider.OKX,
  SwapProvider.ONE_INCH,
  SwapProvider.VELORA,
];

test.describe("Swap - token approval", () => {
  test.skip(
    process.env.DISABLE_TRANSACTION_BROADCAST !== "0",
    "Token approval flow requires broadcast to be enabled — runs on Monday nightly only",
  );

  setupEnv(false);

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: fromAccount.currency.speculosApp,

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
    `[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap token approval flow`,
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm"],
      annotation: [
        {
          type: "TMS",
          description: xrayTicket,
        },
      ],
    },
    async ({ app }) => {
      const provider = await pickRotatingProvider(eligibleProviders, fromAccount, toAccount);
      // Approval (Step 1) can take 1-5 min; extend beyond the 400s CI default.
      test.setTimeout(480_000);
      await app.swap.logSelectedProvider(provider.uiName);
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await revokeTokenApproval(fromAccount, provider);
      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount, provider);
      await performSwapUntilQuoteSelectionStep(app, swap, minAmount);
      await app.swap.selectSpecificProvider(provider);
      await app.swap.clickExchangeButton(provider.name);
      await app.swap.expectTwoStepApprovalScreen();
      await app.swap.clickGiveApprovalButton();
      await app.swap.clickContinueButton();
      await app.speculos.signTokenApproval();
      if (provider === SwapProvider.UNISWAP) {
        await app.swap.clickGiveAuthorizationButton();
        await app.speculos.signTypedMessage();
      }
      await app.swap.expectTwoStepSignScreen();
      await app.swap.expectTransactionSentToasterToBeVisible();
    },
  );
});
