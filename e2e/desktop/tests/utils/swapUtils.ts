import test from "tests/fixtures/common";
import { Application } from "tests/page";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { getSpeculosModel } from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ModularDialog } from "tests/page/dialog/modular.dialog";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import {
  isTokenAllowanceSufficientCommand,
  approveTokenCommand,
  revokeTokenCommand,
  getTokenAllowanceCommand,
} from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import * as allure from "allure-js-commons";
import BigNumber from "bignumber.js";
import { withTemporarySpeculos } from "tests/utils/speculosUtils";
import { TIMEOUT } from "tests/utils/timeouts";

export function setupEnv(disableBroadcast: boolean = false): void {
  test.use({
    env: {
      SWAP_DISABLE_APPS_INSTALL: "true",
      ...(disableBroadcast ? { DISABLE_TRANSACTION_BROADCAST: "1" } : {}),
    },
  });
}

async function checkAccountFromIsSynchronised(app: Application, swap: Swap) {
  await app.mainNavigation.openTargetFromMainNavigation("accounts");
  await app.accounts.clickSyncBtnForAccount(swap.accountToDebit.accountName);
  await app.accounts.navigateToAccountByName(swap.accountToDebit.accountName);
  await app.account.verifySendButtonVisibility();
}

export async function performSwapUntilQuoteSelectionStep({
  app,
  swap,
  minAmount,
  checkLandingPage = false,
}: {
  app: Application;
  swap: Swap;
  minAmount: string;
  checkLandingPage?: boolean;
}) {
  if (swap.accountToDebit.currency === Currency.APT) {
    await checkAccountFromIsSynchronised(app, swap);
  }
  await app.swap.goAndWaitForSwapToBeReady(() =>
    app.mainNavigation.openTargetFromMainNavigation("swap"),
  );
  if (checkLandingPage) {
    await app.swap.softAssertTrendingAssetsPanel();
    await app.swap.softAssertStablecoinsPanel();
  }
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

// Resolves the native account picker after a token-only deeplink: the modular
// dialog (Wallet 4.0+) or the legacy drawer. 30s covers back-to-back dialogs.
export async function selectAccountFromDeeplinkDrawer(app: Application, account: Account) {
  const isModularDialogVisible = await app.modularDialog.waitForAccountSelectionVisible(
    TIMEOUT.xlarge,
  );
  if (isModularDialogVisible) {
    await app.modularDialog.selectAccountByName(account);
  } else {
    await app.swapDrawer.selectAccountByName(account);
  }
}

export async function handleSwapErrorOrSuccess(
  app: Application,
  swap: Swap,
  minAmount: string,
  errorMessage: string | null,
  expectedErrorPerDevice?: { [deviceId: string]: string },
) {
  const provider = await app.swap.selectExchangeWithoutKyc(swap);
  await app.swap.checkQuoteCardCtaPresence(provider.uiName);
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

  // A short allowance is revoked first, as USDT rejects a change from one non-zero allowance to another.
  await revokeTokenApproval(fromAccount, provider);
  const spender = provider.contractAddress;
  await withTemporarySpeculos(fromAccount.currency.speculosApp.name, async () => {
    const result = await approveTokenCommand(
      fromAccount,
      spender,
      new BigNumber(minAmount).times(12).div(10).toFixed(),
    );
    await allure.description(`Token approval result for ${provider.uiName}:\n\n ${result}`);
  });
}

export async function revokeTokenApproval(
  fromAccount: Account | TokenAccount,
  provider: SwapProvider,
) {
  if (!provider.contractAddress || !fromAccount.parentAccount) return;

  const spender = provider.contractAddress;
  let allowance = await getTokenAllowanceCommand(fromAccount, spender);
  if (allowance !== "0") {
    await withTemporarySpeculos(fromAccount.currency.speculosApp.name, async () => {
      const result = await revokeTokenCommand(fromAccount, spender);
      await allure.description(`Token revoke result for ${provider.uiName}:\n\n ${result}`);
    });
    allowance = await getTokenAllowanceCommand(fromAccount, spender);
  }
  if (allowance !== "0") {
    throw new Error(
      `Token allowance revoke did not settle for ${provider.uiName}: expected "0", got "${allowance}"`,
    );
  }
}
