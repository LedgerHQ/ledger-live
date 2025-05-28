import test from "../fixtures/common";
import { Application } from "../page";
import { ElectronApplication } from "@playwright/test";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";

export function setupEnv(disableBroadcast?: boolean) {
  const originalBroadcastValue = process.env.DISABLE_TRANSACTION_BROADCAST;
  test.beforeAll(async () => {
    process.env.SWAP_DISABLE_APPS_INSTALL = "true";
    if (disableBroadcast) process.env.DISABLE_TRANSACTION_BROADCAST = "1";
  });
  test.afterAll(async () => {
    delete process.env.SWAP_DISABLE_APPS_INSTALL;
    if (originalBroadcastValue !== undefined) {
      process.env.DISABLE_TRANSACTION_BROADCAST = originalBroadcastValue;
    } else {
      delete process.env.DISABLE_TRANSACTION_BROADCAST;
    }
  });
}

export async function performSwapUntilQuoteSelectionStep(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
  minAmount: string,
) {
  await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

  await app.swap.selectAssetFrom(electronApp, swap.accountToDebit);
  await app.swapDrawer.selectAccountByName(swap.accountToDebit);
  await app.swap.checkAssetFrom(electronApp, swap.accountToDebit.currency.ticker);
  await app.swap.selectAssetTo(electronApp, swap.accountToCredit.currency.name);
  await app.swapDrawer.selectAccountByName(swap.accountToCredit);
  await app.swap.checkAssetTo(electronApp, swap.accountToCredit.currency.ticker);
  await app.swap.fillInOriginCurrencyAmount(electronApp, minAmount);
}

export async function performSwapUntilDeviceVerificationStep(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
  selectedProvider: string,
  amount: string,
) {
  await app.swap.clickExchangeButton(electronApp, selectedProvider);

  const amountTo = await app.swapDrawer.getAmountToReceive();
  const fees = await app.swapDrawer.getFees();

  swap.setAmountToReceive(amountTo);
  swap.setFeesAmount(fees);

  await app.swapDrawer.verifyAmountToReceive(amountTo);
  await app.swapDrawer.verifyAmountSent(amount.toString(), swap.accountToDebit.currency.ticker);
  await app.swapDrawer.verifySourceAccount(swap.accountToDebit.currency.name);
  await app.swapDrawer.verifyTargetCurrency(swap.accountToCredit.currency.name);
  await app.swapDrawer.verifyProvider(selectedProvider);
}
