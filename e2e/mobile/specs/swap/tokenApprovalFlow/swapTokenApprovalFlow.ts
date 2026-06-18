import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { performSwapUntilQuoteSelectionStep, revokeTokenApproval } from "../../../utils/swapUtils";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { beforeAllFunctionSwap } from "../swap.setup";
import { getAmountFromUSD } from "@ledgerhq/live-common/e2e/currencyUtils";
import { setTeamOwner } from "../../../helpers/allure/allure-helper";
import { pickRotatingProvider } from "@ledgerhq/live-common/e2e/swap";

export function runSwapTokenApprovalFlow(
  fromAccount: TokenAccount,
  toAccount: Account,
  swapProviders: SwapProvider[],
  tmsLinks: string[],
  tags: string[],
) {
  const isBroadcastEnabled = process.env.DISABLE_TRANSACTION_BROADCAST === "0";
  if (!isBroadcastEnabled) {
    console.warn(
      "[approval.swap.spec] Skipping — requires DISABLE_TRANSACTION_BROADCAST=0 (Monday nightly only)",
    );
  }
  (isBroadcastEnabled ? describe : describe.skip)("Token approval - flow", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(fromAccount, toAccount);
      await beforeAllFunctionSwap({
        userdata: "skip-onboarding",
        speculosApp: fromAccount.currency.speculosApp,
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

    it("Swap - token approval flow", async () => {
      const provider = await pickRotatingProvider(swapProviders, fromAccount, toAccount);
      await app.swap.logSelectedProvider(provider.uiName);
      await revokeTokenApproval(fromAccount, provider);
      const amountToSwap = await getAmountFromUSD(fromAccount.currency.id, 5);
      if (amountToSwap === null) {
        throw new Error(`Could not resolve USD amount for ${fromAccount.currency.id}`);
      }
      const swap = new Swap(fromAccount, toAccount, amountToSwap.toString(), provider);
      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        amountToSwap.toString(),
        true,
      );
      await app.swapLiveApp.selectSpecificProvider(provider.uiName);
      await app.swapLiveApp.tapExecuteSwap(provider.uiName);
      await app.swapLiveApp.expectTwoStepApprovalScreen();
      await app.swapLiveApp.tapGiveApprovalButton();
      await app.send.summaryContinue();
      await app.speculos.signTokenApproval();
      if (provider === SwapProvider.UNISWAP) {
        await app.swapLiveApp.tapGiveAuthorizationButton();
        await app.speculos.signTypedMessage();
      }
      await app.swapLiveApp.expectExecuteSwapOnStepApproval();
    }, 480_000);
  });
}
