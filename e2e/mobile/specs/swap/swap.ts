import { SwapType } from "@ledgerhq/live-e2e-shared/models/Swap";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { setEnv } from "@ledgerhq/live-env";
import { performSwapUntilQuoteSelectionStep, truncateSwapAmount } from "../../utils/swapUtils";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { beforeAllFunctionSwap } from "./swap.setup";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const beforeAllFunction = async (swap: SwapType) => {
  await app.speculos.setExchangeDependencies(swap);
  await beforeAllFunctionSwap({
    speculosApp: AppInfos.EXCHANGE,
    cliCommandsOnApp: [
      {
        app: swap.accountToDebit.currency.speculosApp,
        cmd: liveDataWithAddressCommand(swap.accountToDebit),
      },
      {
        app: swap.accountToCredit.currency.speculosApp,
        cmd: liveDataWithAddressCommand(swap.accountToCredit),
      },
    ],
  });
};

export function runSwapTest(
  accountToDebit: Account,
  accountToCredit: Account,
  tmsLinks: string[],
  tags: string[],
  fee: Fee = Fee.MEDIUM,
) {
  // The amount is resolved at runtime from the provider minimum and set on `swap` inside the test.
  const swap = new Swap(accountToDebit, accountToCredit, "", undefined, fee);

  describe("Swap - Accepted (without tx broadcast)", () => {
    beforeAll(async () => {
      await beforeAllFunction(swap);
    });

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Swap ${accountToDebit.currency.name} to ${accountToCredit.currency.name}`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(accountToDebit, accountToCredit);
      const swapAmount = minAmount ? truncateSwapAmount(minAmount) : minAmount;
      swap.amount = swapAmount;

      await performSwapUntilQuoteSelectionStep(accountToDebit, accountToCredit, swapAmount);

      const provider = await app.swapLiveApp.selectExchange();
      const exchangeButtonText = await app.swapLiveApp.checkExchangeButtonHasProviderName(
        provider.uiName,
        true,
      );
      if (app.swapLiveApp.isApprovalRequired(exchangeButtonText, provider.uiName)) {
        console.warn(
          `[swap] ${provider.uiName} requires token approval for ${accountToDebit.currency.name}; ` +
            `skipping swap completion (covered by the token-approval spec).`,
        );
      } else {
        await app.common.disableSynchronizationForiOS();
        await app.swapLiveApp.tapExecuteSwap(provider.uiName);
        await app.swap.verifyAmountsAndAcceptSwap(swap, swapAmount);
        await app.swap.waitForSuccessAndContinue();
      }
    });
  });
}
