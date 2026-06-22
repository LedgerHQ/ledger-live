import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import {
  setupEnv,
  performSwapUntilQuoteSelectionStep,
  revokeTokenApproval,
  ensureTokenApproval,
} from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import BigNumber from "bignumber.js";
import { pickRotatingProvider } from "@ledgerhq/live-common/e2e/swap";

const fromAccount = TokenAccount.ETH_USDT_1;
const toAccount = Account.ETH_1;
const eligibleProviders = [
  SwapProvider.THORCHAIN,
  SwapProvider.LIFI,
  SwapProvider.OKX,
  SwapProvider.ONE_INCH,
  SwapProvider.VELORA,
];
const provider = pickRotatingProvider(eligibleProviders);

test.describe("Token reapproval - flow", () => {
  test.skip(
    process.env.DISABLE_TRANSACTION_BROADCAST !== "0",
    "Token re-approval (bigger amount) flow requires broadcast to be enabled — runs on Monday nightly only",
  );

  setupEnv(false);

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: fromAccount.currency.speculosApp ?? AppInfos.ETHEREUM,

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
    "Swap - token reapproval flow",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
      annotation: [
        {
          type: "TMS",
          description: "B2CQA-4012",
        },
      ],
    },
    async ({ app }) => {
      // Reapproval broadcasts revoke + approve and waits for each to confirm on mainnet; extend beyond the 400s CI default.
      test.setTimeout(600_000);
      await app.swap.logSelectedProvider(provider.uiName);
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await revokeTokenApproval(fromAccount, provider);
      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const smallAmount = new BigNumber(minAmount).div(4).toFixed(6, BigNumber.ROUND_DOWN);
      await ensureTokenApproval(fromAccount, provider, smallAmount);
      const swap = new Swap(fromAccount, toAccount, minAmount, provider);
      await performSwapUntilQuoteSelectionStep(app, swap, minAmount);
      await app.swap.selectSpecificProvider(provider);
      await app.swap.clickExchangeButton(provider.name);
      await app.swap.expectResetApprovalScreen();
      await app.swap.clickRevokeApprovalButton();
      await app.swap.clickContinueButton();
      await app.speculos.signTokenApproval();
      await app.swap.expectTransactionSentToasterToBeVisible();
      await app.swap.expectTwoStepApprovalScreen();
      await app.swap.clickGiveApprovalButton();
      await app.swap.clickContinueButton();
      await app.speculos.signTokenApproval();
      await app.swap.expectTwoStepSignScreen();
    },
  );
});
