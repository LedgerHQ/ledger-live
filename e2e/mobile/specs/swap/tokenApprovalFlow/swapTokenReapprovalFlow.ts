import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import {
  ensureTokenApproval,
  performSwapUntilQuoteSelectionStep,
  revokeTokenApproval,
} from "../../../utils/swapUtils";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { beforeAllFunctionSwap } from "../swap.setup";
import { setTeamOwner } from "../../../helpers/allure/allure-helper";
import BigNumber from "bignumber.js";
import { pickRotatingProvider } from "@ledgerhq/live-common/e2e/swap";

export function runSwapTokenReapprovalFlow(
  fromAccount: TokenAccount,
  toAccount: Account,
  swapProviders: SwapProvider[],
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
        speculosApp: fromAccount.currency.speculosApp ?? AppInfos.ETHEREUM,

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

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it("Swap - token reapproval flow", async () => {
      const provider = await pickRotatingProvider(swapProviders, fromAccount, toAccount);
      await app.swap.logSelectedProvider(provider.uiName);
      await revokeTokenApproval(fromAccount, provider);
      const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount);
      const smallAmount = new BigNumber(minAmount).div(4).toFixed(6, BigNumber.ROUND_DOWN);
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
      await app.swapLiveApp.expectResetApprovalScreen();
      await app.swapLiveApp.tapRevokeApprovalButton();
      await app.send.summaryContinue();
      await app.speculos.signTokenApproval();
      await app.swapLiveApp.expectTwoStepApprovalScreen();
      await app.swapLiveApp.tapGiveApprovalButton();
      await app.send.summaryContinue();
      await app.speculos.signTokenApproval();
      await app.swapLiveApp.expectExecuteSwapOnStepApproval();
    }, 600_000);
  });
}
