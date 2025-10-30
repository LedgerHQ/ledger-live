import test from "../fixtures/common";
import { Application } from "../page";
import { ElectronApplication } from "@playwright/test";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { getSpeculosModel } from "@ledgerhq/live-common/e2e/speculosAppVersion";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { DeviceModelId } from "@ledgerhq/types-devices";

export function setupEnv(disableBroadcast: boolean = false): void {
  let originalBroadcastValue: string | undefined;
  test.beforeAll(async () => {
    originalBroadcastValue = process.env.DISABLE_TRANSACTION_BROADCAST;
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
  const isAssetFromSelected = await app.swap.checkIfFromAssetIsAlreadySelected(
    swap.accountToDebit.currency.ticker,
    electronApp,
  );
  if (!isAssetFromSelected) {
    await selectAccountFrom(app, electronApp, swap);
  }
  const isAssetToSelected = await app.swap.checkIfToAssetIsAlreadySelected(
    swap.accountToCredit.currency.ticker,
    electronApp,
  );
  if (!isAssetToSelected) {
    await selectAccountTo(app, electronApp, swap);
  }
  await app.swap.fillInOriginCurrencyAmount(electronApp, minAmount);
}

async function selectAssetToAndAccount(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
) {
  const networkName = swap.accountToCredit.parentAccount?.currency.name;
  await app.swap.selectAsset(swap.accountToCredit.currency.name, networkName);
  await app.swapDrawer.selectAccountByName(swap.accountToCredit);
  await app.swap.checkAssetTo(electronApp, swap.accountToCredit.currency.ticker);
}

async function selectAssetFromAndAccount(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
) {
  const networkName = swap.accountToDebit.parentAccount?.currency.name;
  await app.swap.selectAsset(swap.accountToDebit.currency.name, networkName);
  await app.swapDrawer.selectAccountByName(swap.accountToDebit);
  await app.swap.checkAssetFrom(electronApp, swap.accountToDebit.currency.ticker);
}

async function selectAccountFrom(app: Application, electronApp: ElectronApplication, swap: Swap) {
  await app.swap.selectFromAccountCoinSelector(electronApp);
  const isModularDrawer = await app.modularDrawer.isModularAssetsDrawerVisible();
  if (isModularDrawer) {
    await selectAccountMAD(app, swap.accountToDebit);
    await app.swap.checkAssetFrom(electronApp, swap.accountToDebit.currency.ticker);
  } else {
    await selectAssetFromAndAccount(app, electronApp, swap);
  }
}

async function selectAccountTo(app: Application, electronApp: ElectronApplication, swap: Swap) {
  await app.swap.selectToAccountCoinSelector(electronApp);
  const isModularDrawer = await app.modularDrawer.isModularAssetsDrawerVisible();
  if (isModularDrawer) {
    await selectAccountMAD(app, swap.accountToCredit);
    await app.swap.checkAssetTo(electronApp, swap.accountToCredit.currency.ticker);
  } else {
    await selectAssetToAndAccount(app, electronApp, swap);
  }
}

export async function selectAccountMAD(app: Application, account: Account) {
  await app.modularDrawer.selectAssetByTickerAndName(account.currency);
  await app.modularDrawer.selectNetwork(account.currency);
  await app.modularDrawer.selectAccountByName(account);
}

export async function handleSwapErrorOrSuccess(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
  minAmount: string,
  errorMessage: string | null,
  expectedErrorPerDevice?: { [deviceId: string]: string },
) {
  const selectedProvider = await app.swap.selectExchangeWithoutKyc(electronApp);
  await app.swap.clickExchangeButton(electronApp, selectedProvider);

  const deviceId = getSpeculosModel();

  if (errorMessage) {
    const expectedMessage = expectedErrorPerDevice?.[deviceId] ?? errorMessage;
    await app.swapDrawer.checkErrorMessage(expectedMessage);
  } else if (deviceId === DeviceModelId.nanoS) {
    await app.swapDrawer.checkErrorMessage(
      "This receiving account does not belong to the device you have connected. Please change and retry",
    );
  } else {
    await app.swap.waitForPageDomContentLoadedState();
    await app.speculos.verifyAmountsAndAcceptSwapForDifferentSeed(swap, minAmount, errorMessage);
    await app.swapDrawer.verifyExchangeCompletedTextContent(swap.accountToCredit.currency.name);
  }
}
