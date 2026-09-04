import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { ensureTokenApproval, performSwapUntilQuoteSelectionStep } from "@e2e/utils/swapUtils";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setEnv } from "@shared/env";
import { beforeAllFunctionSwap } from "@e2e/specs/swap/swap.setup";
import { getAmountFromUSD } from "@ledgerhq/live-e2e-shared/currencyUtils";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

export function runSwapDexNativeFlow(
  fromAccount: Account,
  toAccount: Account,
  provider: SwapProvider,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap - DEX native flow", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(fromAccount, toAccount);
      await beforeAllFunctionSwap({
        userdata: "skip-onboarding",
        speculosApp: provider.app,
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
    it(`[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap DEX native flow with ${provider.uiName}`, async () => {
      const amountToSwap = await getAmountFromUSD(fromAccount.currency.id, 5);
      if (amountToSwap === null) {
        throw new Error(`Could not resolve USD amount for ${fromAccount.currency.id}`);
      }
      const swap = new Swap(fromAccount, toAccount, amountToSwap.toString(), provider);
      await ensureTokenApproval(fromAccount, provider, amountToSwap.toString());

      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        amountToSwap.toString(),
        true,
      );

      await app.swapLiveApp.selectSpecificProvider(provider.uiName);
      // fromAccount is native, so approval never applies — CTA is always "Review".
      await app.swapLiveApp.checkQuoteCardCta(provider.uiName);
      await app.swapLiveApp.tapExecuteSwap(provider.uiName);
      await app.swapLiveApp.tapExecuteSwapOnStepApproval();
      await app.send.summaryContinue();
      await app.send.dismissHighFeeModal();

      await app.swap.verifyAmountsAndAcceptSwap(swap, Number(amountToSwap).toFixed(8));
      await app.swapLiveApp.expectExecuteSwapOnStepApproval();
    });
  });
}
