import { getElementById } from "../../helpers";
import { expect } from "detox";

export default class OperationDetailsPage {
  title = () => getElementById("operationDetails-title");
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
