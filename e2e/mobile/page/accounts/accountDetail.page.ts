import { Step } from "jest-allure2-reporter/api";
import { byId, byIdWithDescendantText } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

const OPERATION_ROW_ID = "operations-list-item";

/** The account screen shown when the `accountDetail` flag is on. */
export default class AccountDetailPage {
  private readonly scrollView = byId("account-detail-scroll-view");
  private readonly backButton = byId("navigation-header-back-button");
  private readonly navBarTitle = byId("account-detail-nav-bar-title");
  private readonly navBarAddress = byId("account-detail-nav-bar-address");
  private readonly settingsButton = byId("account-detail-settings-button");
  private readonly settingsMenu = byId("account-settings-menu");
  private readonly changeNameRow = byId("account-settings-change-name");
  private readonly advancedLogsRow = byId("account-settings-advanced-logs");
  private readonly advancedLogsJson = byId("account-settings-advanced-logs-json");
  private readonly removeAccountRow = byId("account-settings-remove-account");
  private readonly removeConfirmButton = byId("account-settings-remove-confirm");
  private readonly editNameInput = byId("account-detail-edit-name-input");
  private readonly editNameScreen = byId("account-detail-edit-name-screen");
  private readonly heroBalance = byId("account-detail-hero-balance");
  private readonly heroAction = (action: string) => byId(`account-detail-hero-actions-${action}`);
  private readonly transferDrawer = byId("transfer-drawer");
  private readonly transferDrawerAction = (action: string) => byId(`transfer-action-${action}`);
  private readonly sendAssetPicker = byId("transfer-asset-picker-list");
  private readonly sendAssetPickerRow = (currencyId: string) =>
    byId(`transfer-asset-picker-${currencyId}`);
  private readonly transactions = byId("account-detail-transactions");
  private readonly anyOperationRow = byId(OPERATION_ROW_ID);
  private readonly operationRowWithType = (operationType: string) =>
    byIdWithDescendantText({ id: OPERATION_ROW_ID, text: operationType });

  @Step("Wait for account detail screen and verify account name {{{0}}}")
  async waitAndVerifyAccountName(accountName: string) {
    await this.scrollView.waitVisible();
    await this.navBarTitle.expectText(accountName);
  }

  @Step("Check if account detail is visible")
  async isVisible(timeout = TIMEOUT.xxsmall) {
    return await this.scrollView.isVisible(timeout);
  }

  @Step("Go back from account detail")
  async goBack() {
    await this.backButton.tap();
  }

  @Step("Expect account balance to be visible")
  async expectBalanceVisible() {
    await this.heroBalance.expectVisible();
  }

  @Step("Get visible account address label")
  async getVisibleAddressLabel() {
    await this.navBarAddress.expectVisible();
    return await this.navBarAddress.getLabel();
  }

  @Step("Expect account receive and send actions")
  async expectReceiveAndSendActionsVisible() {
    await this.openTransferDrawer();
    await this.transferDrawerAction("receive").expectVisible();
    await this.transferDrawerAction("send").expectVisible();
    await this.transferDrawer.swipe("down");
    await this.transferDrawer.waitNotVisible();
  }

  @Step("Tap on receive")
  async tapReceive() {
    // A currency that can't send gets a Receive tile instead of Transfer.
    if (await this.heroAction("receive").isVisible(TIMEOUT.xxsmall)) {
      await this.heroAction("receive").tap();
      return;
    }
    await this.openTransferDrawer();
    await this.transferDrawerAction("receive").tap();
  }

  @Step("Tap on send {{{0}}}")
  async tapSend(currencyId?: string) {
    await this.openTransferDrawer();
    await this.transferDrawerAction("send").tap();
    // An account holding several assets asks which one to send first.
    if (currencyId && (await this.sendAssetPicker.isVisible(TIMEOUT.small))) {
      await this.sendAssetPicker.waitFullyVisible();
      // The rows are sorted by value: the asset can sit below the visible ones.
      await this.sendAssetPickerRow(currencyId).scrollTo(this.sendAssetPicker);
      await this.sendAssetPickerRow(currencyId).tap();
    }
  }

  private async openTransferDrawer() {
    await this.heroAction("transfer").tap();
    // Anchor on the container: the actions are matchable while the sheet still slides.
    await this.transferDrawer.waitFullyVisible();
  }

  @Step("Expect operation history to be visible")
  async expectOperationHistoryVisible() {
    await this.scrollToTransactions();
    await this.transactions.expectExist();
    await this.anyOperationRow.expectVisible();
  }

  @Step("Scroll to operation history")
  async scrollToTransactions() {
    await this.scrollView.waitVisible();
    await this.anyOperationRow.scrollTo(this.scrollView, { pixels: 300 });
  }

  @Step("Scroll to history and click on last operation {{{0}}}")
  async scrollToHistoryAndClickOnLastOperation(operationType: string) {
    await this.scrollToTransactions();
    await this.operationRowWithType(operationType).tap();
  }

  @Step("Open account settings")
  async openSettings() {
    await this.settingsButton.tap();
    await this.settingsMenu.waitFullyVisible();
  }

  @Step("Open account advanced logs")
  async openAdvancedLogs() {
    await this.advancedLogsRow.tap();
  }

  @Step("Get account advanced logs")
  async getAdvancedLogs() {
    return await this.advancedLogsJson.getText();
  }

  @Step("Select account deletion")
  async selectDelete() {
    await this.removeAccountRow.tap();
  }

  @Step("Confirm account deletion")
  async confirmDelete() {
    await this.removeConfirmButton.tap();
  }

  @Step("Select account edit name")
  async selectRename() {
    await this.changeNameRow.tap();
  }

  @Step("Enter new account name and submit {{{0}}}")
  async enterNewName(name: string) {
    await this.editNameInput.replaceText(name);
    await this.editNameScreen.waitNotExist();
    await this.navBarTitle.expectText(name);
  }
}
