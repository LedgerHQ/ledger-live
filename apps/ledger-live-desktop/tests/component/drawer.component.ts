import { Component } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";

export class Drawer extends Component {
  readonly content = this.page.getByTestId("drawer-content");
  private drawerOverlay = this.page.locator("[data-testid='drawer-overlay'][style='opacity: 1;']");
  private continueButton = this.page.getByTestId("drawer-continue-button");
  private closeButton = this.page.getByTestId("drawer-close-button").first();
  private currencyButton = (currency: string) =>
    this.page.getByTestId(`currency-row-${currency.toLowerCase()}`).first();
  readonly selectAssetTitle = this.page.getByTestId("select-asset-drawer-title").first();
  readonly selectAccountTitle = this.page.getByTestId("select-account-drawer-title").first();
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
    const accountButton = this.getAccountButton(accountName, index);
    // Wait for account row to render before clicking (React 19 deferred rendering)
    await accountButton.waitFor({ state: "visible" });
    await accountButton.click();
  }

  back() {
    return this.backButton.click();
  }
}
