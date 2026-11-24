import pages from "@e2e-mobile/pages/pages";
import { swapSetup } from "@e2e-mobile/bridge/server";
import { performSwapUntilQuoteSelectionStep } from "@e2e-mobile/flows/swap.flows";

import { setEnv } from "@shared/env";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";

import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import type { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import type { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import {
  isTokenAllowanceSufficientCommand,
  liveDataWithAddressCommand,
} from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { needsTokenAllowance } from "@ledgerhq/live-e2e-shared/swap";
import { verifyAmountsAndAcceptSwap } from "@ledgerhq/live-e2e-shared/speculos";
import BigNumber from "bignumber.js";

import { addTag } from "@wdio/allure-reporter";
import { InitializationManager } from "@e2e-mobile/utils/InitialisationManager";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

/**
 * Mirrors swap-live-app's remote-config decimal cap (currently defaults to 8), not a device
 * firmware limit. A no-op for currencies with <=8 native decimals.
 */
export function truncateSwapAmount(amount: string): string {
  return new BigNumber(amount).decimalPlaces(8, BigNumber.ROUND_DOWN).toFixed();
}

async function isTokenApprovalExpected(options: {
  fromAccount: Account;
  provider: SwapProvider;
  minAmount: string;
}): Promise<boolean> {
  const { fromAccount, provider, minAmount } = options;
  if (!needsTokenAllowance(fromAccount, provider)) return false;
  const sufficientAllowance = await isTokenAllowanceSufficientCommand({
    account: fromAccount,
    spenderAddress: provider.contractAddress,
    minAmount,
  });
  return !sufficientAllowance;
}

export const runSwapTest = (
  accountToDebit: Account,
  accountToCredit: Account,
  tmsLinks: string[],
  tags: string[],
  fee: Fee = Fee.MEDIUM,
) => {
  // The amount is resolved at runtime from the provider minimum and set on `swap` inside the test.
  const swap = new Swap({ accountToDebit, accountToCredit, amount: "", speed: fee });

  describe("Swap - accepted", () => {
    it(`[${accountToDebit.currency.testLabel}-${accountToCredit.currency.testLabel}] - Swap`, async () => {
      // allure data
      for (const label of [...tmsLinks, ...tags]) {
        await addTag(label);
      }

      // init options
      const options = {
        speculosApp: AppInfos.EXCHANGE,
        cliCommandsOnApp: [
          {
            app: accountToDebit.currency.speculosApp,
            cmd: liveDataWithAddressCommand(accountToDebit),
          },
          {
            app: accountToCredit.currency.speculosApp,
            cmd: liveDataWithAddressCommand(accountToCredit),
          },
        ],
      };

      await pages.speculos.setExchangeDependencies(swap);

      // init
      await InitializationManager.initialize({
        speculosApp: options.speculosApp,
        featureFlags: {
          ptxSwapLiveAppMobile: {
            enabled: true,
            params: {
              manifest_id:
                process.env.PRODUCTION === "true" ? "swap-live-app-aws" : "swap-live-app-stg-aws",
            },
          },
        },
        cliCommandsOnApp: options.cliCommandsOnApp,
      });

      // go to swap
      await pages.portfolio.waitForPageToLoad();
      await swapSetup();
      await pages.swap.openDeeplink();
      await pages.swapLiveApp.expectLiveApp();

      const minAmount = await pages.swapLiveApp.getMinimumAmount(accountToDebit, accountToCredit);
      const swapAmount = minAmount ? truncateSwapAmount(minAmount) : minAmount;
      swap.amount = swapAmount;

      await performSwapUntilQuoteSelectionStep(accountToDebit, accountToCredit, swapAmount);

      // select provider and run validations
      const provider = await pages.swapLiveApp.selectExchange();
      const approvalRequired = await isTokenApprovalExpected({
        fromAccount: accountToDebit,
        provider,
        minAmount: swapAmount,
      });
      await pages.swapLiveApp.checkQuoteCardCtaPresence(provider.uiName);
      if (approvalRequired) {
        console.warn(
          `[swap] ${provider.uiName} requires token approval for ${accountToDebit.currency.name}; ` +
            `skipping swap completion (covered by the token-approval spec).`,
        );
        return;
      }
      await pages.swapLiveApp.tapExecuteSwap(provider.uiName);
      await verifyAmountsAndAcceptSwap(swap, swapAmount);
      await pages.swap.waitForSuccessAndClose();
      await pages.swap.expectSwapPage();
    });
  });
};
