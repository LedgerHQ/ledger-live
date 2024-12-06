import { Component } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export class Drawer extends Component {
  readonly content = this.page.getByTestId("drawer-content");
  private drawerOverlay = this.page.locator("[data-testid='drawer-overlay'][style='opacity: 1;']");
  private continueButton = this.page.getByTestId("drawer-continue-button");
  private closeButton = this.page.getByTestId("drawer-close-button");
  private currencyButton = (currency: string) =>
    this.page.getByTestId(`currency-row-${currency.toLowerCase()}`).first();
  readonly selectAssetTitle = this.page.getByTestId("select-asset-drawer-title").first();
  readonly selectAccountTitle = this.page.getByTestId("select-account-drawer-title").first();
  readonly swapAmountFrom = this.page.getByTestId("swap-amount-from").first();
  readonly swapAmountTo = this.page.getByTestId("swap-amount-to").first();
  readonly swapAccountFrom = this.page.getByTestId("swap-account-from").first();
  readonly swapAccountTo = this.page.getByTestId("swap-account-to").first();
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

  async waitForDrawerToDisappear() {
    await this.continueButton.waitFor({ state: "detached" });
    await this.closeButton.waitFor({ state: "detached" });
    await this.drawerOverlay.waitFor({ state: "detached" });
  }

  @step("Close drawer")
  async close() {
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
