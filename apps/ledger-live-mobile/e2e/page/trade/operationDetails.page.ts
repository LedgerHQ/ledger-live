import { expect } from "detox";
import { Step } from "jest-allure2-reporter/api";

export default class OperationDetailsPage {
  titleId = "operationDetails-title";
  title = () => getElementById(this.titleId);
  account = () => getElementById("operationDetails-account");
  amount = () => getElementById("operationDetails-amount");

  async isOpened() {
    await expect(this.title()).toBeVisible();
  }

  @Step("Check account details")
  async checkAccount(account: string) {
    await expect(this.account()).toHaveText(account);
  }

  async checkAmount(amount: string) {
    await expect(this.amount()).toHaveText(amount);
  }
}
