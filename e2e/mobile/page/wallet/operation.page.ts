import { Step } from "jest-allure2-reporter/api";

export default class OperationPage {
  // MVVM OperationsList screen
  operationsListId = "operations-list-section-list";
  sectionHeaderId = "operations-section-header";
  operationItemId = "operations-list-item";
  operationCounterValueId = "operations-list-item-counter-value";

  cryptoHistoryTabId = "history-tab-crypto";
  cardHistoryTabId = "history-tab-card";
  cardHistoryListId = "card-history-list";
  cardHistoryRowId = /card-history-row-.+/;
  cardTransactionDetailSheetContentId = "card-transaction-detail-sheet-content";
  cardTransactionDetailAmountValueId = "card-transaction-detail-value-amount";
  cardTransactionDetailStatusValueId = "card-transaction-detail-value-status";

  @Step("Expect the Crypto history tab")
  async expectCryptoHistoryTab() {
    await detoxExpect(getElementById(this.cryptoHistoryTabId)).toBeVisible();
  }

  @Step("Expect the Card history tab")
  async expectCardHistoryTab() {
    await detoxExpect(getElementById(this.cardHistoryTabId)).toBeVisible();
  }

  @Step("Open the Card history tab")
  async openCardHistoryTab() {
    await tapById(this.cardHistoryTabId);
    await waitForElementById(this.cardHistoryListId);
  }

  @Step("Open the first card transaction")
  async openFirstCardTransaction() {
    await detoxExpect(getElementById(this.cardHistoryRowId, 0)).toBeVisible();
    await tapById(this.cardHistoryRowId, 0);
    await waitForFullyVisibleById(this.cardTransactionDetailSheetContentId);
  }

  @Step("Expect the card transaction amount")
  async expectCardTransactionAmount() {
    await detoxExpect(getElementById(this.cardTransactionDetailAmountValueId)).toBeVisible();
    const amount = await getTextOfElement(this.cardTransactionDetailAmountValueId);
    jestExpect(amount).toMatch(/\d/);
  }

  @Step("Expect the card transaction status to read {{{0}}}")
  async expectCardTransactionStatus(status: string | RegExp) {
    await detoxExpect(getElementById(this.cardTransactionDetailStatusValueId)).toBeVisible();
    const actualStatus = await getLabelOfElement(this.cardTransactionDetailStatusValueId);
    if (typeof status === "string") {
      jestExpect(actualStatus).toEqual(status);
    } else {
      jestExpect(actualStatus).toMatch(status);
    }
  }

  @Step("Expect Operations List to be visible")
  async expectOperationsListVisible() {
    await waitForElementById(this.operationsListId);
  }

  @Step("Expect at least one section header to be visible")
  async expectSectionHeaderVisible() {
    await detoxExpect(getElementById(this.sectionHeaderId, 0)).toBeVisible();
  }

  @Step("Expect at least one operation item to be visible")
  async expectOperationItemVisible() {
    await detoxExpect(getElementById(this.operationItemId, 0)).toBeVisible();
  }

  @Step("Tap first operation item")
  async tapFirstOperationItem() {
    await scrollToId(this.operationItemId, this.operationsListId);
    await tapById(this.operationItemId, 0);
  }

  @Step("Get operation counter value text")
  async getOperationCounterValue() {
    await waitForElementById(this.operationsListId);
    return await getTextOfElement(this.operationCounterValueId);
  }
}
