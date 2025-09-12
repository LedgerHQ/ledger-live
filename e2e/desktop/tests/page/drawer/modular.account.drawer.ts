import { step } from "../../misc/reporters/step";
import { AccountType, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { Drawer } from "../../component/drawer.component";

export class ModularAccountDrawer extends Drawer {
  private drawerContent = this.page.getByTestId("modular-drawer-screen-ACCOUNT_SELECTION");
  private accountRowByName = (accountName: string) =>
    this.page.locator("[data-testid^='account-row-']").filter({ hasText: accountName });
  private addNewExistingAccountButton = this.page.getByText("Add new or existing account");

  @step("Wait for drawer to be visible")
  async waitForDrawerToBeVisible() {
    await this.content.waitFor({ state: "visible" });
    await this.drawerOverlay.waitFor({ state: "attached" });
  }

  @step("Validate modular account drawer is visible")
  async isModularAccountDrawerVisible(): Promise<boolean> {
    await this.waitForDrawerToBeVisible();
    return await this.drawerContent.isVisible();
  }

  @step("Select account by name")
  async selectAccountByName(account: AccountType) {
    const isAccountDrawerVisible = await this.isModularAccountDrawerVisible();
    if (isAccountDrawerVisible) {
      await this.accountRowByName(getParentAccountName(account)).first().click();
    }
  }

  @step("Click on add and existing account button")
  async clickOnAddAndExistingAccountButton() {
    if (await this.isModularAccountDrawerVisible()) {
      await this.addNewExistingAccountButton.click();
    }
  }
}
