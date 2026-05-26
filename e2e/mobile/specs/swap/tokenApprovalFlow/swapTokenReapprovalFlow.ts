import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import {
  ensureTokenApproval,
  performSwapUntilQuoteSelectionStep,
  revokeTokenApproval,
} from "../../../utils/swapUtils";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { beforeAllFunctionSwap } from "../swap.setup";
import BigNumber from "bignumber.js";

export function runSwapTokenReapprovalFlow(
  fromAccount: TokenAccount,
  toAccount: Account,
  provider: Provider,
  tmsLinks: string[],
  tags: string[],
) {
  const isBroadcastEnabled = process.env.DISABLE_TRANSACTION_BROADCAST === "0";
  if (!isBroadcastEnabled) {
    console.warn(
      "[reapproval.swap.spec] Skipping — requires DISABLE_TRANSACTION_BROADCAST=0 (Monday nightly only)",
    );
  }
  (isBroadcastEnabled ? describe : describe.skip)("Token reapproval - flow", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(fromAccount, toAccount);
      await beforeAllFunctionSwap({
        userdata: "skip-onboarding",
        speculosApp: provider.app ?? fromAccount.currency.speculosApp,
        cliCommandsOnApp: [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(fromAccount),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(toAccount),
          },
        ],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it("Swap - token reapproval flow", async () => {
      await app.swap.getSelectedProvider(provider.uiName);
      await revokeTokenApproval(fromAccount, provider);
      const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount);
      const smallAmount = new BigNumber(minAmount).div(4).toFixed();
      await ensureTokenApproval(fromAccount, provider, smallAmount);
      const swap = new Swap(fromAccount, toAccount, minAmount, provider);
      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        minAmount,
        true,
      );
      await app.swapLiveApp.selectSpecificProvider(provider.uiName);
      await app.swapLiveApp.tapExecuteSwap(provider.uiName);
      await app.swapLiveApp.expectTwoStepApprovalScreen();
      await app.swapLiveApp.tapGiveApprovalButton();
      await app.send.summaryContinue();
      await app.speculos.signTokenApproval();
      await app.swapLiveApp.expectExecuteSwapOnStepApproval();
    });
  });
}
