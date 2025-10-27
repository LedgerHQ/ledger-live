import { expect } from "detox";

export default class OperationDetailsPage {
  titleId = "operationDetails-title";
  title = () => getElementById(this.titleId);
  account = () => getElementById("operationDetails-account");
  amount = () => getElementById("operationDetails-amount");

  async isOpened() {
    await expect(this.title()).toBeVisible();
  }

  async checkAccount(account: string) {
    await expect(this.account()).toHaveText(account);
  }

  async checkAmount(amount: string) {
    await expect(this.amount()).toHaveText(amount);
  }
}
