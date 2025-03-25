import { expect } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";
export default class AccountPage {
  baseLink = "account";
  accountGraph = (accountId: string) => getElementById(`account-graph-${accountId}`);
  accountBalance = (accountId: string) => getElementById(`account-balance-${accountId}`);
  accountSettingsButton = () => getElementById("account-settings-button");
  accountAdvancedLogRow = () => getElementById("account-advanced-log-row");
  accountDeleteRow = () => getElementById("account-settings-delete-row");
  accountDeleteConfirm = () => getElementById("delete-account-confirmation-button");
  operationHistorySection = "operations-history-";
  operationHistorySectionRegexp = new RegExp(this.operationHistorySection + ".*");
  operationHistorySectionId = (accountId: string) => this.operationHistorySection + accountId;
  accountScreenScrollView = "account-screen-scrollView";
  accountAdvancedLogsId = "account-advanced-logs";
  receiveButton = () => getElementById("account-quick-action-button-receive");
  sendButton = () => getElementById("account-quick-action-button-send");
  earnButtonId = "account-quick-action-button-earn";
  accountList = /accounts-list-.*/;
  baseAccountName = "account-row-name-";
  accountNameRegExp = new RegExp(`${this.baseAccountName}.*`);

  @Step("Open accounts list via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Expect accounts number")
  async expectAccountsNumber(number: number) {
    jestExpect((await getIdByRegexp(this.accountList)).endsWith(number.toString())).toBeTruthy();
  }

  @Step("Go to the account with the name")
  async goToAccountByName(name: string) {
    await tapById(this.baseAccountName + name);
  }

  @Step("Expect the account name at index")
  async expectAccountName(accountName: string, index = 0) {
    jestExpect(await this.getAccountName(index)).toBe(accountName);
  }

  @Step("Get the account name at index")
  async getAccountName(index = 0) {
    return await getTextOfElement(this.accountNameRegExp, index);
  }

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
    await tapByElement(this.receiveButton());
  }

  @Step("Tap on send button")
  async tapSend() {
    await tapByElement(this.sendButton());
  }

  @Step("Tap on earn button")
  async tapEarn() {
    await scrollToId(this.earnButtonId, this.accountScreenScrollView);
    await tapById(this.earnButtonId);
  }
}
