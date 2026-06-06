import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setEnv } from "@ledgerhq/live-env";
import { performSwapUntilQuoteSelectionStep } from "../../utils/swapUtils";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
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

export function runSwapTest(swap: SwapType, tmsLinks: string[], tags: string[]) {
  describe("Swap - Accepted (without tx broadcast)", () => {
    beforeAll(async () => {
      await beforeAllFunction(swap);
    });

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Swap ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`, async () => {
      const minAmount = await app.swapLiveApp.getMinimumAmount(
        swap.accountToDebit,
        swap.accountToCredit,
      );
      const swapAmount =
        swap.accountToDebit.currency.name === Account.XRP_1.currency.name
          ? parseFloat(Number(minAmount).toFixed(6)).toString()
          : minAmount;

      await performSwapUntilQuoteSelectionStep(
        swap.accountToDebit,
        swap.accountToCredit,
        swapAmount,
      );

      const provider = await app.swapLiveApp.selectExchange();
      await app.swapLiveApp.checkExchangeButtonHasProviderName(provider.uiName);
      await app.common.disableSynchronizationForiOS();
      await app.swapLiveApp.tapExecuteSwap(provider.uiName);
      await app.swap.verifyAmountsAndAcceptSwap(swap, swapAmount);
      await app.swap.waitForSuccessAndContinue();
    });
  });
}
