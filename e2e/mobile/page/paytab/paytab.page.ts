import { Step } from "@support/jest-allure2-reporter/api";

export default class PayTabPage {
  detailsButtonId = "card-details-button";
  fundedStateId = "pay-card-balance-funded-state";

  @Step("Expect the Pay tab to show a funded balance")
  async expectFundedBalance() {
    await detoxExpect(getElementById(this.fundedStateId)).toBeVisible();
  }

  @Step("Expect the card to show the Details button")
  async expectDetailsButton() {
    await scrollToId(this.detailsButtonId);
    await detoxExpect(getElementById(this.detailsButtonId)).toBeVisible();
  }
}
