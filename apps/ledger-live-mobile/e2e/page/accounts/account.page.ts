import { getElementById, getTextOfElement, scrollToId, tapByElement } from "../../helpers";
import { expect } from "detox";
import jestExpect from "expect";

export default class AccountPage {
  accountGraph = (accountId: string) => getElementById(`account-graph-${accountId}`);
  accountBalance = (accountId: string) => getElementById(`account-balance-${accountId}`);
  accountSettingsButton = () => getElementById("account-settings-button");
  accountAdvancedLogRow = () => getElementById("account-advanced-log-row");
  operationHistorySectionId = (accountId: string) => `operations-history-${accountId}`;
  accountScreenScrollView = "account-screen-scrollView";
  accountAdvancedLogsId = "account-advanced-logs";

  async openAccountSettings() {
    await tapByElement(this.accountSettingsButton());
  }

  async openAccountAdvancedLogs() {
    await tapByElement(this.accountAdvancedLogRow());
  }

  async expectOperationHistoryVisible(accountId: string) {
    const id = this.operationHistorySectionId(accountId);
    await scrollToId(id, this.accountScreenScrollView);
    await expect(getElementById(id)).toBeVisible();
  }

  async expectAccountBalanceVisible(accountId: string) {
    await expect(this.accountGraph(accountId)).toBeVisible();
    await expect(this.accountBalance(accountId)).toBeVisible();
  }

  async expectAddressIndex(indexNumber: number) {
    await this.openAccountSettings();
    await this.openAccountAdvancedLogs();
    const advancedLogsText = await getTextOfElement(this.accountAdvancedLogsId);
    const advancedLogsJson = advancedLogsText ? JSON.parse(advancedLogsText) : null;
    jestExpect(advancedLogsJson).toHaveProperty("index", indexNumber);
  }
}
