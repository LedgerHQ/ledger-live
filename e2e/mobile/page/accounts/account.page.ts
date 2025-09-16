import { openDeeplink } from "../../helpers/commonHelpers";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export default class AccountPage {
  baseLink = "account";
  accountListTitleId = "accounts-list-title";
  accountScreenScrollView = "account-screen-scrollView";
  accountAdvancedLogsId = "account-advanced-logs";
  earnButtonId = "account-quick-action-button-earn";
  accountRenameTextInputId = "account-rename-text-input";
  baseSubAccountRow = "subAccount-row-name-";
  baseAccountName = "account-row-name-";
  accountNameRegExp = new RegExp(`${this.baseAccountName}.*`);
  operationRowRegexp = new RegExp("operation-row-" + ".*");
  operationHistorySection = "operations-history-";
  operationHistorySectionRegexp = new RegExp(this.operationHistorySection + ".*");
  accountSettingsButtonId = "account-settings-button";
  receiveButtonId = "account-quick-action-button-receive";
  sendButtonId = "account-quick-action-button-send";
  swapButtonId = "account-quick-action-button-swap";
  buyButtonId = "account-quick-action-button-buy";

  accountGraph = (accountId: string) => getElementById(this.accountGraphId(accountId));
  accountBalance = (accountId: string) => getElementById(`account-balance-${accountId}`);
  accountAdvancedLogRow = () => getElementById("account-advanced-log-row");
  accountDeleteRow = () => getElementById("account-settings-delete-row");
  accountDeleteConfirm = () => getElementById("delete-account-confirmation-button");
  operationHistorySectionId = (accountId: string) => this.operationHistorySection + accountId;

  accountRenameRow = () => getElementById("account-settings-rename-row");
  getSpecificOperation = (operationType: string) =>
    getElementByIdAndText(this.operationRowRegexp, operationType, 0);
  subAccountId = (account: Account) =>
    `js:2:${account.currency.id}:${account.parentAccount ? account.parentAccount.address : account.address}:${account.currency.id}Sub+${account.address}`;
  accountGraphId = (accountId: string) => `account-graph-${accountId}`;

  @Step("Open accounts list via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
    await waitForElementById(this.accountListTitleId);
  }

  @Step("Go to the account with the name")
  async goToAccountByName(name: string) {
    await waitForElementById(this.baseAccountName + name);
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

  @Step("Select account edit name")
  async selectAccountRename() {
    await tapByElement(this.accountRenameRow());
  }

  @Step("Enter new account name and submit")
  async enterNewAccountName(name: string) {
    await typeTextById(this.accountRenameTextInputId, name);
  }

  @Step("Expect operation history to be visible")
  async expectOperationHistoryVisible(accountId: string) {
    const id = this.operationHistorySectionId(accountId);
    await scrollToId(id, this.accountScreenScrollView, 1000, "bottom");
    await detoxExpect(getElementById(id)).toBeVisible();
  }

  @Step("Scroll to operation history")
  async scrollToTransactions() {
    await waitForElementById(this.accountScreenScrollView);
    await scrollToId(
      this.operationHistorySectionRegexp,
      this.accountScreenScrollView,
      300,
      "bottom",
    );
  }

  @Step("Scroll to a Specific SubAccount Row")
  async scrollToSubAccount(subAccountId: string) {
    await waitForElementById(this.accountScreenScrollView);
    await scrollToId(subAccountId, this.accountScreenScrollView, 650, "down");
  }

  @Step("Expect account balance to be visible")
  async expectAccountBalanceVisible(accountId: string) {
    await detoxExpect(this.accountGraph(accountId)).toBeVisible();
    await detoxExpect(this.accountBalance(accountId)).toBeVisible();
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

  @Step("Tap on swap button")
  async tapSwap() {
    await scrollToId(this.swapButtonId, this.accountScreenScrollView);
    await tapById(this.swapButtonId);
  }

  @Step("Tap on buy button")
  async tapBuy() {
    await scrollToId(this.buyButtonId, this.accountScreenScrollView);
    await tapById(this.buyButtonId);
  }

  @Step("Navigate to token in account")
  async navigateToTokenInAccount(subAccount: Account) {
    const subAccountId = this.baseSubAccountRow + subAccount.currency.ticker;
    await this.scrollToSubAccount(subAccountId);
    await tapById(subAccountId);
  }

  @Step("Scroll to history and click on last operation")
  async scrollToHistoryAndClickOnLastOperation(operationType: string) {
    await this.scrollToTransactions();
    await tapByElement(this.getSpecificOperation(operationType));
  }
}
