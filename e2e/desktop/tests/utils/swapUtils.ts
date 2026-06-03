import test from "tests/fixtures/common";
import { Application } from "tests/page";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { getSpeculosModel } from "@ledgerhq/live-common/e2e/speculosAppVersion";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ModularDialog } from "tests/page/dialog/modular.dialog";
import { getModularSelector } from "./modularSelectorUtils";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import {
  isTokenAllowanceSufficientCommand,
  approveTokenCommand,
  revokeTokenCommand,
  getTokenAllowanceCommand,
} from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { getEnv } from "@ledgerhq/live-env";
import * as allure from "allure-js-commons";
import BigNumber from "bignumber.js";
import { launchSpeculos, cleanSpeculos } from "./speculosUtils";

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
  await app.mainNavigation.openTargetFromMainNavigation("accounts");
  await app.accounts.clickSyncBtnForAccount(swap.accountToDebit.accountName);
  await app.accounts.navigateToAccountByName(swap.accountToDebit.accountName);
  await app.account.verifySendButtonVisibility();
}

export async function performSwapUntilQuoteSelectionStep(
  app: Application,
  swap: Swap,
  minAmount: string,
) {
  if (swap.accountToDebit.currency === Currency.APT) {
    await checkAccountFromIsSynchronised(app, swap);
  }
  await app.swap.goAndWaitForSwapToBeReady(() =>
    app.mainNavigation.openTargetFromMainNavigation("swap"),
  );
  const isAssetFromSelected = await app.swap.checkIfFromAssetIsAlreadySelected(
    swap.accountToDebit.currency.ticker,
  );
  if (!isAssetFromSelected) {
    await selectAccountFrom(app, swap);
  }
  const isAssetToSelected = await app.swap.checkIfToAssetIsAlreadySelected(
    swap.accountToCredit.currency.ticker,
  );
  if (!isAssetToSelected) {
    await selectAccountTo(app, swap);
  }
  await app.swap.fillInOriginCurrencyAmount(minAmount);
}

async function selectAccountFrom(app: Application, swap: Swap) {
  await app.swap.selectFromAccountCoinSelector();
  const selector = await getModularSelector(app, "ASSET");
  if (selector) {
    await selectAccountMAD(selector, swap.accountToDebit);
    await app.swap.checkAssetFromContains(swap.accountToDebit.currency.ticker);
  }
}

async function selectAccountTo(app: Application, swap: Swap) {
  await app.swap.selectToAccountCoinSelector();
  const selector = await getModularSelector(app, "ASSET");
  if (selector) {
    await selectAccountMAD(selector, swap.accountToCredit);
    await app.swap.checkAssetToContains(swap.accountToCredit.currency.ticker);
  }
}

export async function selectAccountMAD(selector: ModularDialog, account: Account) {
  await selector.selectAsset(account.currency);
  await selector.selectNetwork(account.currency);
  await selector.selectAccountByName(account);
}

export async function handleSwapErrorOrSuccess(
  app: Application,
  swap: Swap,
  minAmount: string,
  errorMessage: string | null,
  expectedErrorPerDevice?: { [deviceId: string]: string },
) {
  const provider = await app.swap.selectExchangeWithoutKyc(swap);
  await app.swap.clickExchangeButton(provider.name);

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

export async function ensureTokenApproval(
  fromAccount: Account | TokenAccount,
  provider: SwapProvider,
  minAmount: string,
) {
  if (!provider.contractAddress || !fromAccount.parentAccount) return;

  const currentAllowance = await isTokenAllowanceSufficientCommand(
    fromAccount,
    provider.contractAddress,
    minAmount,
  );
  console.log("CLI result: Current Allowance: ", currentAllowance);
  if (currentAllowance) return;

  const previousSpeculosPort = getEnv("SPECULOS_API_PORT");
  const speculos = await launchSpeculos(fromAccount.currency.speculosApp.name);
  try {
    const result = await approveTokenCommand(
      fromAccount,
      provider.contractAddress,
      new BigNumber(minAmount).times(12).div(10).toFixed(),
    );
    await allure.description(`Token approval result for ${provider.uiName}:\n\n ${result}`);
  } finally {
    await cleanSpeculos(speculos, previousSpeculosPort);
  }
}

export async function revokeTokenApproval(fromAccount: TokenAccount, provider: SwapProvider) {
  if (!provider.contractAddress) return;

  const allowance = await getTokenAllowanceCommand(fromAccount, provider.contractAddress);
  if (allowance === "0") return;

  const previousSpeculosPort = getEnv("SPECULOS_API_PORT");
  const speculos = await launchSpeculos(fromAccount.currency.speculosApp.name);
  try {
    const result = await revokeTokenCommand(fromAccount, provider.contractAddress);
    await allure.description(`Token revoke result for ${provider.uiName}:\n\n ${result}`);
  } finally {
    await cleanSpeculos(speculos, previousSpeculosPort);
  }
}
