import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
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

const xrayTicket = "B2CQA-4012";
const fromAccount = TokenAccount.ETH_USDC_1;
const toAccount = Account.ETH_1;
const eligibleProviders = [Provider.THORCHAIN, Provider.LIFI, Provider.OKX];
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
    "Swap - token reapproval flow",
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
      await app.swap.getSelectedProvider(provider.uiName);
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await revokeTokenApproval(fromAccount, provider);
      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const smallAmount = new BigNumber(minAmount).div(4).toFixed();
      await ensureTokenApproval(fromAccount, provider, smallAmount);
      const swap = new Swap(fromAccount, toAccount, minAmount, provider);
      await performSwapUntilQuoteSelectionStep(app, swap, minAmount);
      await app.swap.selectSpecificProvider(provider);
      await app.swap.clickExchangeButton(provider.name);
      await app.swap.expectTwoStepApprovalScreen();
      await app.swap.clickGiveApprovalButton();
      await app.swap.clickContinueButton();
      await app.speculos.signTokenApproval();
      await app.swap.expectTwoStepSignScreen();
      await app.swap.expectTransactionSentToasterToBeVisible();
    },
  );
});
