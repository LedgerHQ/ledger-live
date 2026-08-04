import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { performSwapUntilQuoteSelectionStep } from "../../../utils/swapUtils";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setEnv } from "@shared/env";
import { beforeAllFunctionSwap } from "../swap.setup";
import { setTeamOwner } from "../../../helpers/allure/allure-helper";
import { launchApp } from "helpers/commonHelpers";
import { pickRotatingProvider } from "@ledgerhq/live-e2e-shared/swap";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

export function runSwapCrossAccountTest(
  fromAccount: TokenAccount,
  toAccount: Account,
  providers: SwapProvider[],
  tmsLinks: string[],
  tags: string[],
) {
  describe("Swap cross account warning", () => {
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

    it("Should show a visible warning for a cross account swap", async () => {
      const provider = await pickRotatingProvider(providers, fromAccount, toAccount);
      await app.swap.logSelectedProvider(provider.uiName);
      const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount, [
        provider.name,
      ]);
      const errorMessage =
        "Cross-account swaps are not currently supported. Please ensure your sending and receiving accounts are the same.";
      await performSwapUntilQuoteSelectionStep(fromAccount, toAccount, minAmount, true, true);
      await app.swapLiveApp.selectSpecificProvider(provider.uiName);
      await app.swapLiveApp.verifySwapCrossAccountErrorMessageIsCorrect(errorMessage);
    });
  });
}
