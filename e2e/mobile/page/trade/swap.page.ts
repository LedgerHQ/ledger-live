import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "../../helpers/commonHelpers";
import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { normalizeText } from "../../helpers/commonHelpers";
import fs from "fs/promises";
import * as path from "path";
import { FileUtils } from "../../utils/fileUtils";

export default class SwapPage {
  baseLink = "swap";
  confirmSwapOnDeviceDrawerId = "confirm-swap-on-device";
  swapSuccessTitleId = "swap-success-title";
  swapOperationDetailsScrollViewId = "swap-operation-details-scroll-view";
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
  swapStatus = "swap-status";
  exportOperationsButton = "export-swap-operations-link";

  operationDetails = {
    fromAccount: "swap-operation-details-fromAccount",
    toAccount: "swap-operation-details-toAccount",
    fromAmount: "swap-operation-details-fromAmount",
    toAmount: "swap-operation-details-toAmount",
    provider: "swap-operation-details-provider",
    providerLink: "swap-operation-details-provider-link",
    swapId: "swap-operation-details-swapId",
    date: "swap-operation-details-date",
    viewInExplorerButton: "operation-detail-view-in-explorer-button",
  };

  swapFormTab = () => getElementById("swap-form-tab");
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
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
    await waitForElementById(app.common.walletApiWebview);
  }

  @Step("Expect swap page")
  async expectSwapPage() {
    const tab = this.swapFormTab();
    await detoxExpect(tab).toBeVisible();
  }

  @Step("Go to swap history")
  async goToSwapHistory() {
    await tapById(this.historyButton);
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

  @Step("Verify swap operation details")
  async expectSwapDrawerInfos(swapId: string, swap: SwapType, provider: Provider) {
    jestExpect(normalizeText(await getTextOfElement(this.swapStatus))).toMatch(/Pending|Finished/);
    await detoxExpect(getElementByText("Swap ID")).toBeVisible();
    jestExpect(normalizeText(await getTextOfElement(this.operationDetails.swapId))).toEqual(swapId);
    if (await IsIdVisible(this.operationDetails.providerLink)) {
      jestExpect(normalizeText(await getTextOfElement(this.operationDetails.providerLink))).toEqual(
        normalizeText(provider.uiName),
      );
    } else {
      jestExpect(normalizeText(await getTextOfElement(this.operationDetails.provider))).toEqual(
        normalizeText(provider.uiName),
      );
    }
    jestExpect(normalizeText(await getTextOfElement(this.operationDetails.date))).toMatch(
      /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/,
    );
    jestExpect(normalizeText(await getTextOfElement(this.operationDetails.fromAccount))).toEqual(
      normalizeText(swap.accountToDebit.accountName),
    );
    jestExpect(normalizeText(await getTextOfElement(this.operationDetails.fromAmount))).toEqual(
      normalizeText(`${swap.amount} ${swap.accountToDebit.currency.ticker}`),
    );

    await scrollToId(this.operationDetails.toAmount, this.swapOperationDetailsScrollViewId);
    jestExpect(normalizeText(await getTextOfElement(this.operationDetails.toAccount))).toEqual(
      normalizeText(swap.accountToCredit.accountName),
    );
    await detoxExpect(getElementById(this.operationDetails.toAmount)).toBeVisible();

    await detoxExpect(getElementById(this.operationDetails.viewInExplorerButton)).toBeVisible();
  }

  @Step("Click on export operations")
  async clickExportOperations() {
    await tapById(this.exportOperationsButton);
    const filePath = path.resolve(__dirname, "../../artifacts/ledgerwallet-swap-history.csv");
    const fileExists = await FileUtils.waitForFileToExist(filePath, 5000);
    jestExpect(fileExists).toBeTruthy();
  }

  @Step("Check contents of exported operations file")
  async checkExportedFileContents(swap: SwapType, provider: Provider, id: string) {
    const targetFilePath = path.resolve(__dirname, "../../artifacts/ledgerwallet-swap-history.csv");
    const fileContents = await fs.readFile(targetFilePath, "utf-8");

    jestExpect(fileContents).toContain(provider.name);
    jestExpect(fileContents).toContain(id);
    jestExpect(fileContents).toContain(swap.accountToDebit.currency.ticker);
    jestExpect(fileContents).toContain(swap.accountToCredit.currency.ticker);
    jestExpect(fileContents).toContain(swap.amount);
    jestExpect(fileContents).toContain(swap.accountToDebit.accountName);
    jestExpect(fileContents).toContain(swap.accountToDebit.address);
    jestExpect(fileContents).toContain(swap.accountToCredit.accountName);
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
    await waitForElementById(this.swapSuccessTitleId, 60000, {
      errorElementId: app.swapLiveApp.deviceActionErrorDescriptionId,
    });
    await tapById(app.common.proceedButtonId);
  }
}
