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
  private readonly changeNameRow = byId("account-settings-change-name");
  private readonly advancedLogsRow = byId("account-settings-advanced-logs");
  private readonly advancedLogsJson = byId("account-settings-advanced-logs-json");
  private readonly removeAccountRow = byId("account-settings-remove-account");
  private readonly removeConfirmButton = byId("account-settings-remove-confirm");
  private readonly editNameInput = byId("account-detail-edit-name-input");
  private readonly heroBalance = byId("account-detail-hero-balance");
  private readonly heroAction = (action: string) => byId(`account-detail-hero-actions-${action}`);
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

  @Step("Expect account transfer action to be visible")
  async expectTransferActionVisible() {
    await this.heroAction("transfer").expectVisible();
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
  }
}
