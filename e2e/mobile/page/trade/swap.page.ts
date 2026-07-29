import CommonPage from "../common.page";
import { Step } from "jest-allure2-reporter/api";
import { openDeeplink, normalizeText, isIos } from "../../helpers/commonHelpers";
import { SwapType } from "@ledgerhq/live-e2e-shared/models/Swap";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import fs from "fs/promises";
import * as path from "path";
import { FileUtils } from "../../utils/fileUtils";
import { getParentAccountName } from "@ledgerhq/live-e2e-shared/enum/Account";
import { retryUntilTimeout } from "../../utils/retry";

export default class SwapPage extends CommonPage {
  baseLink = "swap";
  confirmSwapOnDeviceDrawerId = "confirm-swap-on-device";
  swapSuccessTitleId = "swap-success-title";
  deviceActionLoading = "device-action-loading";
  operationRow = {
    rowBaseId: "swap-operation-row-",
    rowRegexp: new RegExp("swap-operation-row-.*"),
    baseFromAccount: "swap-history-fromAccount-",
    baseToAccount: "swap-history-toAccount-",
    baseFromAmount: "swap-history-fromAmount-",
    baseToAmount: "swap-history-toAmount-",
  };
  historyButton = "navigation-header-swap-history";
  topBarSwapHistoryButton = "topbar-swap-history";
  exportOperationsButton = "enabled-export-swap-operations-link";
  swapHistoryFeedbackLink = "swap-history-feedback-link";

  operationRows = () => getElementById(this.operationRow.rowRegexp);
  getSpecificOperation = (swapId: string) =>
    getElementById(`${this.operationRow.rowBaseId}${swapId}`);

  specificOperationAccountFromId = (swapId: string) =>
    `${this.operationRow.baseFromAccount}${swapId}`;
  specificOperationAccountToId = (swapId: string) => `${this.operationRow.baseToAccount}${swapId}`;
  specificOperationAmountFromId = (swapId: string) =>
    `${this.operationRow.baseFromAmount}${swapId}`;
  specificOperationAmountToId = (swapId: string) => `${this.operationRow.baseToAmount}${swapId}`;

  @Step("Open swap via deeplink")
  async openViaDeeplink(params?: string) {
    const deeplinkPath = params ? `${this.baseLink}?${params}` : this.baseLink;
    await openDeeplink(deeplinkPath);
    // checkVisibility: false — an ambiguous token can open an account-picker drawer
    // that covers the webview first; callers already check visibility themselves.
    await waitForElementById(app.common.walletApiWebview, undefined, { checkVisibility: false });
  }

  @Step("Expect swap page")
  async expectSwapPage() {
    await detoxExpect(getElementById(app.common.walletApiWebview)).toBeVisible();
  }

  @Step("Go to swap history")
  async goToSwapHistory() {
    if (await IsIdVisible(this.topBarSwapHistoryButton, 5000)) {
      await tapById(this.topBarSwapHistoryButton);
    } else {
      await tapById(this.historyButton);
    }
  }

  @Step("Check swap operation row details")
  async checkSwapOperation(swapId: string, swap: SwapType) {
    await detoxExpect(this.operationRows()).toBeVisible();
    await detoxExpect(this.getSpecificOperation(swapId)).toBeVisible();
    jestExpect(await getTextOfElement(this.specificOperationAccountFromId(swapId))).toEqual(
      swap.accountToDebit.accountName,
    );
    jestExpect(await getTextOfElement(this.specificOperationAccountToId(swapId))).toEqual(
      swap.accountToCredit.accountName,
    );
    const amountText = await getTextOfElement(this.specificOperationAmountFromId(swapId));
    jestExpect(normalizeText(amountText)).toEqual(
      normalizeText(`${swap.amount} ${swap.accountToDebit.currency.ticker}`),
    );
    await detoxExpect(getElementById(this.specificOperationAmountToId(swapId))).toBeVisible();
  }

  @Step("Open selected operation by swapId: $0")
  async openSelectedOperation(swapId: string) {
    await tapByElement(this.getSpecificOperation(swapId));
  }

  @Step("Click on export operations")
  async clickExportOperations() {
    await tapById(this.exportOperationsButton);
    const filePath = path.resolve(__dirname, "../../artifacts/ledgerwallet-swap-history.csv");
    const fileExists = await FileUtils.waitForFileToExist(filePath, 5000);
    jestExpect(fileExists).toBeTruthy();
  }

  @Step("Check swap history feedback form URL")
  async checkSwapHistoryFeedbackFormUrl(expectedUrl: string) {
    await scrollToId(this.swapHistoryFeedbackLink);
    await detoxExpect(getElementById(this.swapHistoryFeedbackLink)).toBeVisible();
    const { value, label } = await getAttributesOfElement(this.swapHistoryFeedbackLink);
    // iOS: accessibilityValue: value; Android: accessibilityLabel: label
    if (isIos()) {
      jestExpect(value).toContain(expectedUrl);
    } else {
      jestExpect(label).toContain(expectedUrl);
    }
  }

  @Step("Check contents of exported operations file")
  async checkExportedFileContents(swap: SwapType, provider: SwapProvider, id: string) {
    const targetFilePath = path.resolve(__dirname, "../../artifacts/ledgerwallet-swap-history.csv");
    const fileContents = await fs.readFile(targetFilePath, "utf-8");

    jestExpect(fileContents).toContain(provider.name);
    jestExpect(fileContents).toContain(id);
    jestExpect(fileContents).toContain(swap.accountToDebit.currency.ticker);
    jestExpect(fileContents).toContain(swap.accountToCredit.currency.ticker);
    jestExpect(fileContents).toContain(swap.amount);
    jestExpect(fileContents).toContain(getParentAccountName(swap.accountToDebit));
    jestExpect(fileContents).toContain(swap.accountToDebit.address);
    jestExpect(fileContents).toContain(getParentAccountName(swap.accountToCredit));
    jestExpect(fileContents).toContain(swap.accountToCredit.address);
  }

  @Step("Verify the amounts and accept swap")
  async verifyAmountsAndAcceptSwap(swap: SwapType, amount: string) {
    await app.speculos.verifyAmountsAndAcceptSwap(swap, amount);
  }

  @Step("Verify amounts and accept swap for different seed")
  async verifyAmountsAndAcceptSwapForDifferentSeed(
    swap: SwapType,
    amount: string,
    errorMessage: string | null,
  ) {
    await app.speculos.verifyAmountsAndAcceptSwapForDifferentSeed(swap, amount, errorMessage);
  }

  @Step("Verify the amounts and reject swap")
  async verifyAmountsAndRejectSwap(swap: SwapType, amount: string) {
    await app.speculos.verifyAmountsAndRejectSwap(swap, amount);
  }

  @Step("Wait for swap success and continue")
  async waitForSuccessAndContinue() {
    await waitForElementById(this.swapSuccessTitleId, 120000, {
      errorElementId: app.swapLiveApp.deviceActionErrorDescriptionId,
    });
    await tapById(app.common.proceedButtonId);
  }

  @Step("Wait for swap success and close")
  async waitForSuccessAndClose() {
    await waitForElementById(this.swapSuccessTitleId, 120000, {
      errorElementId: app.swapLiveApp.deviceActionErrorDescriptionId,
    });
    let tapped = false;
    await retryUntilTimeout(async () => {
      if (tapped && !(await IsIdVisible(this.swapSuccessTitleId, 500))) {
        return; // already dismissed by a previous tap — nothing left to do
      }
      await app.common.closePage();
      tapped = true;
      if (await IsIdVisible(this.swapSuccessTitleId, 1000)) {
        throw new Error("swap-success-title still visible after close tap");
      }
    }, 60000);
  }

  @Step("Selected provider: $0")
  async logSelectedProvider(providerName: string) {
    jestExpect(providerName).toBeDefined();
  }
}
