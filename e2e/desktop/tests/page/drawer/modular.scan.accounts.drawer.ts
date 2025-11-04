import { Drawer } from "../../component/drawer.component";
import { step } from "../../misc/reporters/step";
import { expect } from "@playwright/test";

export class ModularScanAccountsDrawer extends Drawer {
  private drawerContent = this.page.getByTestId("modular-drawer-screen-SCAN_ACCOUNTS");
  private confirmButton = this.page.getByRole("button", { name: "Confirm" });
  private continueButton = this.page.getByRole("button", { name: "Continue" });
  private closeDrawerButton = this.page.getByRole("button", { name: "Close" });
  private deselectAllButton = this.page.getByText("Deselect all");
  private checkbox = this.page.getByTestId("right-element-checkbox").first();
  private successAddLabel = this.page.getByTestId("accounts-added-title");

  @step("Validate modular scan accounts drawer is visible")
  async isModularScanAccountsDrawerVisible(): Promise<boolean> {
    await this.waitForDrawerToBeVisible();
    return await this.drawerContent.isVisible();
  }

  @step("Click Confirm button on scan accounts drawer")
  async clickConfirmButton() {
    await this.confirmButton.click();
  }

  @step("Click Continue button on scan accounts drawer")
  async clickContinueButton() {
    await this.continueButton.click();
  }

  @step("Click Close button")
  async clickCloseButton() {
    await this.closeDrawerButton.click();
  }

  @step("Select first account")
  async selectFirstAccount() {
    const stopRecovery = this.recoverFromGetAppAndVersionError();
    await this.confirmButton.waitFor({ state: "visible" });
    if (await this.deselectAllButton.isVisible()) {
      await this.deselectAllButton.click();
      await this.checkbox.click();
    }
    await this.clickConfirmButton();
    await expect(this.successAddLabel).toBeVisible();
    stopRecovery();
  }
}
