import {
  getElementById,
  getTextOfElement,
  scrollToId,
  tapByElement,
  tapById,
  expect,
  waitForElementById,
} from "../../helpers";
import jestExpect from "expect";

export default class AccountPage {
  accountGraph = (accountId: string) => getElementById(`account-graph-${accountId}`);
  accountBalance = (accountId: string) => getElementById(`account-balance-${accountId}`);
  accountSettingsButtonId = "account-settings-button";
  accountAdvancedLogRow = () => getElementById("account-advanced-log-row");
  accountDeleteRow = () => getElementById("account-settings-delete-row");
  accountDeleteConfirm = () => getElementById("delete-account-confirmation-button");
  operationHistorySection = "operations-history-";
  operationHistorySectionRegexp = new RegExp(this.operationHistorySection + ".*");
  operationHistorySectionId = (accountId: string) => this.operationHistorySection + accountId;
  accountScreenScrollView = "account-screen-scrollView";
  accountAdvancedLogsId = "account-advanced-logs";
  receiveButtonId = "account-quick-action-button-receive";
  sendButtonId = "account-quick-action-button-send";
  earnButtonId = "account-quick-action-button-earn";

  @Step("Open account settings")
  async openAccountSettings() {
    await waitForElementById(this.accountSettingsButtonId); // Issue with RN75 : QAA-370
    await tapById(this.accountSettingsButtonId);
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

  @Step("Scroll to transaction history")
  async scrollToTransactions() {
    await scrollToId(this.operationHistorySectionRegexp, this.accountScreenScrollView);
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
    await waitForElementById(this.receiveButtonId); // Issue with RN75 : QAA-370
    await tapById(this.receiveButtonId);
  }

  @Step("Tap on send button")
  async tapSend() {
    await waitForElementById(this.sendButtonId); // Issue with RN75 : QAA-370
    await tapById(this.sendButtonId);
  }

  @Step("Tap on earn button")
  async tapEarn() {
    await scrollToId(this.earnButtonId, this.accountScreenScrollView);
    await tapById(this.earnButtonId);
  }
}
