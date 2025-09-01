import test from "../fixtures/common";
import { Application } from "../page";
import { ElectronApplication } from "@playwright/test";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

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

export async function checkAccountFromIsSynchronised(app: Application, swap: Swap) {
  await app.layout.goToAccounts();
  await app.accounts.clickSyncBtnForAccount(swap.accountToDebit.accountName);
  await app.accounts.navigateToAccountByName(swap.accountToDebit.accountName);
  await app.account.verifySendButtonVisibility();
}

export async function performSwapUntilQuoteSelectionStep(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
  minAmount: string,
) {
  if (swap.accountToDebit.currency === Currency.APT) {
    await checkAccountFromIsSynchronised(app, swap);
  }
  await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());
  const isAssetFromSelected = await app.swap.checkIfAssetIsAlreadySelected(
    swap.accountToDebit.currency.ticker,
    electronApp,
  );
  if (!isAssetFromSelected) {
    await app.swap.selectFromAccountCoinSelector(electronApp);
    await selectFromAndToAccount(app, electronApp, swap);
  } else {
    await selectToAccountOnly(app, electronApp, swap);
  }
  await app.swap.fillInOriginCurrencyAmount(electronApp, minAmount);
}

async function selectFromAndToAccount(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
) {
  await app.modularDrawer.selectAssetByTickerAndName(swap.accountToDebit.currency);
  await app.modularDrawer.selectNetwork(swap.accountToDebit.currency);
  await app.modularDrawer.selectAccountByName(swap.accountToDebit);
  await app.swap.checkAssetFrom(electronApp, swap.accountToDebit.currency.ticker);

  await selectToAccountOnly(app, electronApp, swap);
}

async function selectToAccountOnly(app: Application, electronApp: ElectronApplication, swap: Swap) {
  await app.swap.selectToAccountCoinSelector(electronApp);
  await app.modularDrawer.selectAssetByTickerAndName(swap.accountToCredit.currency);
  await app.modularDrawer.selectNetwork(swap.accountToCredit.currency);
  await app.modularDrawer.selectAccountByName(swap.accountToCredit);
  await app.swap.checkAssetTo(electronApp, swap.accountToCredit.currency.ticker);
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
