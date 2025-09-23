import test from "../fixtures/common";
import { Application } from "../page";
import { ElectronApplication } from "@playwright/test";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { getSpeculosModel } from "@ledgerhq/live-common/e2e/speculos";
import { DeviceModelId } from "@ledgerhq/types-devices";

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
    await handleAssetFromNotSelected(app, electronApp, swap);
  } else {
    await handleAssetFromSelected(app, electronApp, swap);
  }
  await app.swap.fillInOriginCurrencyAmount(electronApp, minAmount);
}

async function selectAssetToAndAccount(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
) {
  const networkName = swap.accountToCredit.parentAccount?.currency.name;
  await app.swap.chooseFromAsset(swap.accountToCredit.currency.name, networkName);
  await app.swapDrawer.selectAccountByName(swap.accountToCredit);
  await app.swap.checkAssetTo(electronApp, swap.accountToCredit.currency.ticker);
}

async function selectAssetFromAndAccount(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
) {
  const networkName = swap.accountToDebit.parentAccount?.currency.name;
  await app.swap.chooseFromAsset(swap.accountToDebit.currency.name, networkName);
  await app.swapDrawer.selectAccountByName(swap.accountToDebit);
  await app.swap.checkAssetFrom(electronApp, swap.accountToDebit.currency.ticker);
}

async function legacyDrawerFlow(app: Application, electronApp: ElectronApplication, swap: Swap) {
  await selectAssetToAndAccount(app, electronApp, swap);
}

async function modularDrawerFullFlow(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
) {
  await app.modularDrawer.selectAssetByTickerAndName(swap.accountToDebit.currency);
  await app.modularDrawer.selectNetwork(swap.accountToDebit.currency);
  await app.modularDrawer.selectAccountByName(swap.accountToDebit);
  await app.swap.checkAssetFrom(electronApp, swap.accountToDebit.currency.ticker);

  await app.swap.selectToAccountCoinSelector(electronApp);
  await modularDrawerSelectToAssetOnlyFlow(app, electronApp, swap);
}

async function modularDrawerSelectToAssetOnlyFlow(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
) {
  await app.modularDrawer.selectAssetByTickerAndName(swap.accountToCredit.currency);
  await app.modularDrawer.selectNetwork(swap.accountToCredit.currency);
  await app.modularDrawer.selectAccountByName(swap.accountToCredit);
  await app.swap.checkAssetTo(electronApp, swap.accountToCredit.currency.ticker);
}

async function handleAssetFromNotSelected(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
) {
  await app.swap.selectFromAccountCoinSelector(electronApp);
  const isModularDrawer = await app.modularDrawer.isModularAssetsDrawerVisible();
  if (isModularDrawer) {
    await modularDrawerFullFlow(app, electronApp, swap);
  } else {
    await selectAssetFromAndAccount(app, electronApp, swap);
    await app.swap.selectToAccountCoinSelector(electronApp);
    await selectAssetToAndAccount(app, electronApp, swap);
  }
}

async function handleAssetFromSelected(
  app: Application,
  electronApp: ElectronApplication,
  swap: Swap,
) {
  await app.swap.selectToAccountCoinSelector(electronApp);
  const isModularDrawer = await app.modularDrawer.isModularAssetsDrawerVisible();
  if (isModularDrawer) {
    await modularDrawerSelectToAssetOnlyFlow(app, electronApp, swap);
  } else {
    await legacyDrawerFlow(app, electronApp, swap);
  }
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
    await app.speculos.verifyAmountsAndAcceptSwapForDifferentSeed(swap, minAmount);
    await app.swapDrawer.verifyExchangeCompletedTextContent(swap.accountToCredit.currency.name);
  }
}
