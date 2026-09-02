import { expect, Locator } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";

export class PayTabPage extends AppPage {
  private readonly fundedState: Locator = this.page.getByTestId("pay-card-balance-funded-state");

  @step("Expect the Pay tab to show a funded balance")
  async expectFundedBalance() {
    await expect(this.fundedState).toBeVisible();
  }
}
