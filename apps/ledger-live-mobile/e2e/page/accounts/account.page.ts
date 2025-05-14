export default class AccountPage {
  baseLink = "account";
  accountAdvancedLogRow = () => getElementById("account-advanced-log-row");
  operationHistorySection = "operations-history-";
  operationHistorySectionRegexp = new RegExp(this.operationHistorySection + ".*");
  accountScreenScrollView = "account-screen-scrollView";
  accountList = /accounts-list-.*/;
  baseAccountName = "account-row-name-";
  accountNameRegExp = new RegExp(`${this.baseAccountName}.*`);

  @Step("Expect accounts number")
  async expectAccountsNumber(number: number) {
    jestExpect((await getIdByRegexp(this.accountList)).endsWith(number.toString())).toBeTruthy();
  }

  @Step("Get the account name at index")
  async getAccountName(index = 0) {
    return await getTextOfElement(this.accountNameRegExp, index);
  }

  @Step("Open account advanced logs")
  async openAccountAdvancedLogs() {
    await tapByElement(this.accountAdvancedLogRow());
  }

  @Step("Scroll to transaction history")
  async scrollToTransactions() {
    await scrollToId(this.operationHistorySectionRegexp, this.accountScreenScrollView);
  }
}
