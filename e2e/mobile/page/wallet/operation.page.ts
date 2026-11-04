import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";

export default class OperationPage {
  // MVVM OperationsList screen
  private readonly operationsList = byId("operations-list-section-list");
  private readonly sectionHeader = byId("operations-section-header");
  private readonly operationItem = byId("operations-list-item");
  private readonly operationCounterValue = byId("operations-list-item-counter-value");

  private readonly cryptoHistoryTab = byId("history-tab-crypto");
  private readonly cardHistoryTab = byId("history-tab-card");
  private readonly cardHistoryList = byId("card-history-list");
  private readonly cardHistoryRow = byId(/card-history-row-.+/);
  private readonly cardTransactionDetailSheetContent = byId(
    "card-transaction-detail-sheet-content",
  );
  private readonly cardTransactionDetailAmountValue = byId("card-transaction-detail-value-amount");
  private readonly cardTransactionDetailStatusValue = byId("card-transaction-detail-value-status");

  @Step("Expect the Crypto history tab")
  async expectCryptoHistoryTab() {
    await this.cryptoHistoryTab.expectVisible();
  }

  @Step("Expect the Card history tab")
  async expectCardHistoryTab() {
    await this.cardHistoryTab.expectVisible();
  }

  @Step("Open the Card history tab")
  async openCardHistoryTab() {
    await this.cardHistoryTab.tap();
    await this.cardHistoryList.waitVisible();
  }

  @Step("Open the first card transaction")
  async openFirstCardTransaction() {
    await this.cardHistoryRow.expectVisible();
    await this.cardHistoryRow.tap();
    await this.cardTransactionDetailSheetContent.waitFullyVisible();
  }

  @Step("Expect the card transaction amount")
  async expectCardTransactionAmount() {
    await this.cardTransactionDetailAmountValue.expectTextMatching(/\d/);
  }

  @Step("Expect the card transaction status to read {{{0}}}")
  async expectCardTransactionStatus(status: RegExp) {
    // The status is a Lumen Tag: its value is the accessibility label, not its own text.
    await this.cardTransactionDetailStatusValue.expectLabelMatching(status);
  }

  @Step("Expect Operations List to be visible")
  async expectOperationsListVisible() {
    await this.operationsList.waitVisible();
  }

  @Step("Expect at least one section header to be visible")
  async expectSectionHeaderVisible() {
    await this.sectionHeader.expectVisible();
  }

  @Step("Expect at least one operation item to be visible")
  async expectOperationItemVisible() {
    await this.operationItem.expectVisible();
  }

  @Step("Tap first operation item")
  async tapFirstOperationItem() {
    await this.operationItem.scrollTo(this.operationsList);
    await this.operationItem.tap();
  }

  @Step("Get operation counter value text")
  async getOperationCounterValue() {
    return await this.operationCounterValue.getText();
  }
}
