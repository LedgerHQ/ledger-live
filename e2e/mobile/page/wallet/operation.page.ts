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
  cardTransactionDetailId = "card-transaction-detail";

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
    await detoxExpect(getElementById(this.cardHistoryListId)).toBeVisible();
  }

  @Step("Open the first card transaction")
  async openFirstCardTransaction() {
    await detoxExpect(getElementById(this.cardHistoryRowId, 0)).toBeVisible();
    await tapById(this.cardHistoryRowId, 0);
  }

  @Step("Expect the card transaction detail")
  async expectCardTransactionDetail() {
    await detoxExpect(getElementById(this.cardTransactionDetailSheetContentId)).toBeVisible();
    await detoxExpect(getElementById(this.cardTransactionDetailId)).toBeVisible();
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
