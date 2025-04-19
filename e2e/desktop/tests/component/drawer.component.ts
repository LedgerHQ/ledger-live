import { Component } from "../page/abstractClasses";
import { step } from "../misc/reporters/step";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export class Drawer extends Component {
  readonly content = this.page.getByTestId("drawer-content");
  private drawerOverlay = this.page.locator("[data-testid='drawer-overlay'][style='opacity: 1;']");
  private closeButton = this.page.getByTestId("drawer-close-button").first();

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

  public getAccountButton = (accountName: string) =>
    this.page.getByTestId(`account-row-${accountName.toLowerCase()}-0`).first();

  @step("Select account by name")
  async selectAccountByName(account: Account) {
    await this.getAccountButton(account.currency.name)
      .locator(`text=${account.accountName}`)
      .click();
  }
}
