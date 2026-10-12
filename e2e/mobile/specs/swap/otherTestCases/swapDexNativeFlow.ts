import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { ensureTokenApproval, performSwapUntilQuoteSelectionStep } from "@e2e/utils/swapUtils";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setEnv } from "@shared/env";
import { beforeAllFunctionSwap } from "@e2e/specs/swap/swap.setup";
import { getAmountFromUSD } from "@ledgerhq/live-e2e-shared/currencyUtils";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { describeIfNotNanoS } from "@e2e/helpers/commonHelpers";
import { BROADCAST_LOCK_ACQUIRE_TIMEOUT_MS } from "@ledgerhq/live-e2e-shared/broadcastLock";
import { TIMEOUT } from "@e2e/utils/timeouts";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

/** The CLI approval broadcasts despite the flag above, so it may first wait for the account's broadcast lock. */
const TOKEN_APPROVAL_HOOK_TIMEOUT = BROADCAST_LOCK_ACQUIRE_TIMEOUT_MS + TIMEOUT.xxxxlarge;

export function runSwapDexNativeFlow(
  fromAccount: Account,
  toAccount: Account,
  provider: SwapProvider,
  tmsLinks: string[],
  tags: string[],
) {
  (provider.availableOnLns ? describe : describeIfNotNanoS)("Swap - DEX native flow", () => {
    let amountToSwap: number;

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

    beforeAll(async () => {
      const amount = await getAmountFromUSD(fromAccount.currency.id, 5);
      if (amount === null) {
        throw new Error(`Could not resolve USD amount for ${fromAccount.currency.id}`);
      }
      amountToSwap = amount;
      await ensureTokenApproval(fromAccount, provider, amountToSwap.toString());
    }, TOKEN_APPROVAL_HOOK_TIMEOUT);

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap DEX native flow with ${provider.uiName}`, async () => {
      const swap = new Swap(fromAccount, toAccount, amountToSwap.toString(), provider);
      await app.speculos.enableBlindSigningOnNanoS();

      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        amountToSwap.toString(),
        true,
      );

      await app.swapLiveApp.selectSpecificProvider(provider.uiName);
      await app.swapLiveApp.checkQuoteCardCtaPresence(provider.uiName);
      await app.swapLiveApp.tapExecuteSwap(provider.uiName);
      await app.swapLiveApp.tapExecuteSwapOnStepApproval();
      await app.walletApiSignatureDrawer.expectVisible();

      await app.swap.verifyAmountsAndAcceptSwap(swap, Number(amountToSwap).toFixed(8));
      await app.swapLiveApp.expectExecuteSwapOnStepApproval();
    });
  });
}
