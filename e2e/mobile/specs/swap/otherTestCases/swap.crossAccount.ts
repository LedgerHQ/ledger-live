import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { performSwapUntilQuoteSelectionStep } from "@e2e/utils/swapUtils";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setEnv } from "@shared/env";
import { beforeAllFunctionSwap } from "@e2e/specs/swap/swap.setup";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { launchApp } from "@e2e/helpers/commonHelpers";
import { pickRotatingProvider } from "@ledgerhq/live-e2e-shared/swap";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

export function runSwapCrossAccountTest(
  fromAccount: TokenAccount,
  toAccount: Account,
  providers: SwapProvider[],
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap - cross account warning", () => {
    beforeAll(async () => {
      await launchApp({ newInstance: true });
      await app.speculos.setExchangeDependencies(fromAccount, toAccount);
      await beforeAllFunctionSwap({
        userdata: "skip-onboarding",
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

    it(`[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap cross account warning`, async () => {
      const provider = await pickRotatingProvider(providers, fromAccount, toAccount);
      await app.swap.logSelectedProvider(provider.uiName);
      const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount, [
        provider.name,
      ]);
      const errorMessage =
        "Cross-account swaps are not currently supported. Please ensure your sending and receiving accounts are the same.";
      // Pin BOTH accounts. The send account must be selected explicitly — otherwise it
      // takes the first USDT account, which the drawer sorts by fiat value and can be the
      // USDT on Ethereum 3 (the receive account also holds USDT), collapsing the swap to a
      // same-account one so the cross-account warning never shows. See QAA-1478.
      await performSwapUntilQuoteSelectionStep(fromAccount, toAccount, minAmount, true, true, true);
      await app.swapLiveApp.selectSpecificProvider(provider.uiName);
      await app.swapLiveApp.verifySwapCrossAccountErrorMessageIsCorrect(errorMessage);
    });
  });
}
