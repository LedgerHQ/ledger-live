import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { performSwapUntilQuoteSelectionStep, revokeTokenApproval } from "../../../utils/swapUtils";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { beforeAllFunctionSwap } from "../swap.setup";
import { getAmountFromUSD } from "@ledgerhq/live-common/e2e/swap";

export function runSwapApprovalFlow(
  fromAccount: Account,
  toAccount: Account,
  provider: Provider,
  tmsLinks: string[],
  tags: string[],
) {
  const isBroadcastEnabled = process.env.DISABLE_TRANSACTION_BROADCAST === "0";
  if (!isBroadcastEnabled) {
    console.warn(
      "[approval.swap.spec] Skipping — requires DISABLE_TRANSACTION_BROADCAST=0 (Monday nightly only)",
    );
  }
  (isBroadcastEnabled ? describe : describe.skip)("Swap - ERC20 Approval flow", () => {
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

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it(`Swap - ${provider.uiName} approval flow`, async () => {
      await revokeTokenApproval(fromAccount, provider);
      await app.swap.ensureRevokeTokenApproval(fromAccount, provider);
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
      await app.swapLiveApp.tapExecuteSwap(provider.name);
      await app.swapLiveApp.expectTwoStepApprovalScreen();
      await app.swapLiveApp.tapGiveApprovalButton();
      await app.send.summaryContinue();
      await app.speculos.signTokenApproval();
      if (provider === Provider.UNISWAP) {
        await app.swapLiveApp.tapGiveAuthorizationButton();
        await app.speculos.signTypedMessage();
      }
      await app.swapLiveApp.expectTwoStepSignScreen();
    });
  });
}
