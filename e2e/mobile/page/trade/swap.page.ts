import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import { SwapType } from "@ledgerhq/live-e2e-shared/models/Swap";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import fs from "fs/promises";
import * as path from "path";
import { FileUtils } from "@e2e/utils/fileUtils";
import { getParentAccountName } from "@ledgerhq/live-e2e-shared/enum/Account";
import { TIMEOUT } from "@e2e/utils/timeouts";

const EXPORTED_HISTORY_PATH = path.resolve(
  __dirname,
  "../../artifacts/ledgerwallet-swap-history.csv",
);

export default class SwapPage {
  private readonly baseLink = "swap";

  private readonly proceedButton = byId("proceed-button");
  private readonly deviceActionError = byId(app.swapLiveApp.deviceActionErrorDescriptionId);
  private readonly swapSuccessTitle = byId("swap-success-title");
  private readonly historyButton = byId("navigation-header-swap-history");
  private readonly topBarSwapHistoryButton = byId("topbar-swap-history");
  private readonly exportOperationsButton = byId("enabled-export-swap-operations-link");
  private readonly swapHistoryFeedbackLink = byId("swap-history-feedback-link");
  private readonly anyOperationRow = byId(/swap-operation-row-.*/);
  private readonly operationRow = (swapId: string) => byId(`swap-operation-row-${swapId}`);
  private readonly operationFromAccount = (swapId: string) =>
    byId(`swap-history-fromAccount-${swapId}`);
  private readonly operationToAccount = (swapId: string) =>
    byId(`swap-history-toAccount-${swapId}`);
  private readonly operationFromAmount = (swapId: string) =>
    byId(`swap-history-fromAmount-${swapId}`);
  private readonly operationToAmount = (swapId: string) => byId(`swap-history-toAmount-${swapId}`);

  @Step("Open swap via deeplink {{{0}}}")
  async openViaDeeplink(params?: string) {
    const deeplinkPath = params ? `${this.baseLink}?${params}` : this.baseLink;
    await openDeeplink(deeplinkPath);
    // Exists, not visible: an ambiguous token can open an account-picker drawer
    // that covers the webview first; callers already check visibility themselves.
    await app.common.waitForWalletApiWebview();
  }

  @Step("Expect swap page")
  async expectSwapPage() {
    await app.common.expectWalletApiWebview();
  }

  @Step("Go to swap history")
  async goToSwapHistory() {
    if (await this.topBarSwapHistoryButton.isVisible(TIMEOUT.small)) {
      await this.topBarSwapHistoryButton.tap();
    } else {
      await this.historyButton.tap();
    }
  }

  @Step("Check swap operation row details {{{0}}}")
  async checkSwapOperation(swapId: string, swap: SwapType) {
    await this.anyOperationRow.expectVisible();
    await this.operationRow(swapId).expectVisible();
    await this.operationFromAccount(swapId).waitVisible();
    await this.operationFromAccount(swapId).expectText(swap.accountToDebit.accountName);
    await this.operationToAccount(swapId).expectText(swap.accountToCredit.accountName);
    await this.operationFromAmount(swapId).expectText(
      `${swap.amount} ${swap.accountToDebit.currency.ticker}`,
      { normaliseWhitespace: true },
    );
    await this.operationToAmount(swapId).expectVisible();
  }

  @Step("Open selected operation by swapId: {{{0}}}")
  async openSelectedOperation(swapId: string) {
    await this.operationRow(swapId).tap();
  }

  @Step("Click on export operations")
  async clickExportOperations() {
    await this.exportOperationsButton.tap();
    const fileExists = await FileUtils.waitForFileToExist(EXPORTED_HISTORY_PATH);
    jestExpect(fileExists).toBeTruthy();
  }

  @Step("Check swap history feedback form URL {{{0}}}")
  async checkSwapHistoryFeedbackFormUrl(expectedUrl: string) {
    await this.swapHistoryFeedbackLink.expectVisible();
    await this.swapHistoryFeedbackLink.expectAccessibilityValue(expectedUrl, { containing: true });
  }

  @Step("Check contents of exported operations file {{{2}}}")
  async checkExportedFileContents(swap: SwapType, provider: SwapProvider, id: string) {
    const fileContents = await fs.readFile(EXPORTED_HISTORY_PATH, "utf-8");

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

  @Step("Verify the amounts and accept swap {{{1}}}")
  async verifyAmountsAndAcceptSwap(swap: SwapType, amount: string) {
    await app.speculos.verifyAmountsAndAcceptSwap(swap, amount);
  }

  @Step("Verify amounts {{{1}}} and accept swap for different seed")
  async verifyAmountsAndAcceptSwapForDifferentSeed(
    swap: SwapType,
    amount: string,
    errorMessage: string | null,
  ) {
    await app.speculos.verifyAmountsAndAcceptSwapForDifferentSeed(swap, amount, errorMessage);
  }

  @Step("Verify the amounts and reject swap {{{1}}}")
  async verifyAmountsAndRejectSwap(swap: SwapType, amount: string) {
    await app.speculos.verifyAmountsAndRejectSwap(swap, amount);
  }

  @Step("Wait for swap success and continue")
  async waitForSuccessAndContinue() {
    await this.swapSuccessTitle.waitVisible(TIMEOUT.xxxlarge, this.deviceActionError);
    await this.proceedButton.tap();
  }

  @Step("Wait for swap success and close")
  async waitForSuccessAndClose() {
    await this.swapSuccessTitle.waitVisible(TIMEOUT.xxxlarge, this.deviceActionError);
    await app.common.closePage();
    await this.swapSuccessTitle.waitNotVisible();
  }

  @Step("Selected provider: {{{0}}}")
  async logSelectedProvider(providerName: string) {
    jestExpect(providerName).toBeDefined();
  }
}
