import { element, by } from "detox";
import { Step } from "jest-allure2-reporter/api";

export default class OperationPage {
  // MVVM OperationsList screen
  operationsListId = "operations-list-section-list";
  sectionHeaderId = "operations-section-header";
  operationItemId = "operations-list-item";
  operationCounterValueId = "operations-list-item-counter-value";

  @Step("Expect Operations List to be visible")
  async expectOperationsListVisible() {
    await waitForElementById(this.operationsListId);
  }

  @Step("Expect at least one section header to be visible")
  async expectSectionHeaderVisible() {
    await detoxExpect(element(by.id(this.sectionHeaderId)).atIndex(0)).toBeVisible();
  }

  @Step("Expect at least one operation item to be visible")
  async expectOperationItemVisible() {
    await detoxExpect(element(by.id(this.operationItemId)).atIndex(0)).toBeVisible();
  }

  @Step("Tap first operation item")
  async tapFirstOperationItem() {
    await scrollToId(this.operationItemId, this.operationsListId);
    await tapByElement(element(by.id(this.operationItemId)).atIndex(0));
  }

  @Step("Get operation counter value text")
  async getOperationCounterValue() {
    await waitForElementById(this.operationsListId);
    return await getTextOfElement(this.operationCounterValueId);
  }
}
