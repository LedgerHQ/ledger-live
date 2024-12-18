import { getElementById, getTextOfElement, scrollToId, tapByElement } from "../../helpers";
import { expect } from "detox";
import jestExpect from "expect";

export default class AccountPage {
  accountGraph = (accountId: string) => getElementById(`account-graph-${accountId}`);
  accountBalance = (accountId: string) => getElementById(`account-balance-${accountId}`);
  accountSettingsButton = () => getElementById("account-settings-button");
  accountAdvancedLogRow = () => getElementById("account-advanced-log-row");
  accountDeleteRow = () => getElementById("account-settings-delete-row");
  accountDeleteConfirm = () => getElementById("delete-account-confirmation-button");
  operationHistorySectionId = (accountId: string) => `operations-history-${accountId}`;
  accountScreenScrollView = "account-screen-scrollView";
  accountAdvancedLogsId = "account-advanced-logs";
  receiveButton = () => getElementById("account-quick-action-button-Receive");

  @Step("Open account settings")
  async openAccountSettings() {
    await tapByElement(this.accountSettingsButton());
  }

  @Step("Open account advanced logs")
  async openAccountAdvancedLogs() {
    await tapByElement(this.accountAdvancedLogRow());
  }

  @Step("Select account deletion")
  async selectAccountDelete() {
    await tapByElement(this.accountDeleteRow());
  }

  @Step("Confirm account deletion")
  async confirmAccountDelete() {
    await tapByElement(this.accountDeleteConfirm());
  }

  @Step("Expect operation history to be visible")
  async expectOperationHistoryVisible(accountId: string) {
    const id = this.operationHistorySectionId(accountId);
    await scrollToId(id, this.accountScreenScrollView);
    await expect(getElementById(id)).toBeVisible();
  }

  @Step("Expect account balance to be visible")
  async expectAccountBalanceVisible(accountId: string) {
    await expect(this.accountGraph(accountId)).toBeVisible();
    await expect(this.accountBalance(accountId)).toBeVisible();
  }

  @Step("Expect address index")
  async expectAddressIndex(indexNumber: number) {
    await this.openAccountSettings();
    await this.openAccountAdvancedLogs();
    const advancedLogsText = await getTextOfElement(this.accountAdvancedLogsId);
    const advancedLogsJson = advancedLogsText ? JSON.parse(advancedLogsText) : null;
    jestExpect(advancedLogsJson).toHaveProperty("index", indexNumber);
  }

  @Step("Tap on receive button")
  async tapReceive() {
    await tapByElement(this.receiveButton());
  }
}
