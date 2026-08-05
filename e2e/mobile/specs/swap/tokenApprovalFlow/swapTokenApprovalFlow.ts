import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { performSwapUntilQuoteSelectionStep, revokeTokenApproval } from "../../../utils/swapUtils";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { beforeAllFunctionSwap } from "../swap.setup";
import { getAmountFromUSD } from "@ledgerhq/live-e2e-shared/currencyUtils";
import { setTeamOwner } from "../../../helpers/allure/allure-helper";
import { pickRotatingProvider } from "@ledgerhq/live-e2e-shared/swap";
import { BroadcastFlow, shouldRunBroadcastFlow } from "../../../helpers/broadcastRotation";

export function runSwapTokenApprovalFlow(
  fromAccount: TokenAccount,
  toAccount: Account,
  swapProviders: SwapProvider[],
  tmsLinks: string[],
  tags: string[],
) {
  const runHere = shouldRunBroadcastFlow(BroadcastFlow.APPROVAL);
  if (!runHere) {
    const broadcastEnabled = process.env.DISABLE_TRANSACTION_BROADCAST === "0";
    const bothPlatforms = process.env.E2E_BOTH_PLATFORMS === "true";
    console.warn(
      broadcastEnabled && bothPlatforms
        ? "[approval.swap.spec] Skipping — rotated to the other platform for this run (avoids shared-account broadcast race)"
        : "[approval.swap.spec] Skipping — requires DISABLE_TRANSACTION_BROADCAST=0",
    );
  }
  (runHere ? describe : describe.skip)("Swap - token approval", () => {
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

    it(`[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap token approval flow`, async () => {
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
