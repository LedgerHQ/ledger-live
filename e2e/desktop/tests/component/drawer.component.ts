import { Component } from "../page/abstractClasses";
import { step } from "../misc/reporters/step";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export class Drawer extends Component {
  readonly content = this.page.getByTestId("drawer-content");
  private drawerOverlay = this.page.locator("[data-testid='drawer-overlay'][style='opacity: 1;']");
  private continueButton = this.page.getByTestId("drawer-continue-button");
  private closeButton = this.page.getByTestId("drawer-close-button").first();
  private currencyButton = (currency: string) =>
    this.page.getByTestId(`currency-row-${currency.toLowerCase()}`).first();
  readonly backButton = this.page.getByRole("button", { name: "Back" });

  async continue() {
    await this.continueButton.click();
  }

  @step("Wait for drawer to be visible")
  async waitForDrawerToBeVisible() {
    await this.content.waitFor({ state: "visible" });
    await this.closeButton.waitFor({ state: "visible" });
    await this.drawerOverlay.waitFor({ state: "attached" });
  }

  @step("Close drawer")
  async closeDrawer() {
    await this.closeButton.click();
  }

  // CURRENCY/ASSET ACTIONS
  async selectCurrency(currency: string) {
    await this.currencyButton(currency).click();
  }

  public getAccountButton = (accountName: string, index: number) =>
    this.page.getByTestId(`account-row-${accountName.toLowerCase()}-${index}`).first();

  async selectAccount(accountName: string, index = 0) {
    await this.getAccountButton(accountName, index).click();
  }

  @step("Select account by name")
  async selectAccountByName(account: Account, index = 0) {
    await this.getAccountButton(account.currency.name, index)
      .locator(`text=${account.accountName}`)
      .click();
  }

  back() {
    return this.backButton.click();
  }
}
