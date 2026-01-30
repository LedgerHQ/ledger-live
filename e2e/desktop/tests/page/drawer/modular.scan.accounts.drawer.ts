import { Drawer } from "../../component/drawer.component";
import { step } from "../../misc/reporters/step";
import { expect } from "@playwright/test";

export class ModularScanAccountsDrawer extends Drawer {
  private drawerContent = this.page.getByTestId("modular-drawer-screen-SCAN_ACCOUNTS");
  private confirmButton = this.page.getByRole("button", { name: "Confirm" });
  private continueButton = this.page.getByRole("button", { name: "Continue" });
  private allowButton = this.page.getByRole("button", { name: "Allow" });
  private shareViewKeyButton = this.page.getByRole("button", { name: "Share view key" });
  private closeDrawerButton = this.page.getByRole("button", { name: "Close" });
  private deselectAllButton = this.page.getByText("Deselect all");
  private checkbox = this.page.getByTestId("right-element-checkbox").first();
  private successAddLabel = this.page.getByTestId("accounts-added-title");
  private viewKeyWarningStep = this.page.getByTestId("view-key-warning-step");
  private viewKeyConfirmationStep = this.page.getByTestId("view-key-confirmation-step");

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

  @step("Click Allow button on scan accounts drawer")
  async clickAllowButton() {
    await this.allowButton.click();
  }

  @step("Click Share view key button on scan accounts drawer")
  async clickShareViewKeyButton() {
    await this.shareViewKeyButton.click();
  }

  @step("Click Close button")
  async clickCloseButton() {
    await this.closeDrawerButton.click();
  }

  @step("Wait for view key warning step to be visible")
  async expectViewKeyWarningVisibility() {
    await this.viewKeyWarningStep.waitFor({ state: "visible" });
  }

  @step("Expect success step to be visible")
  async expectSuccessStepVisibility() {
    await expect(this.successAddLabel).toBeVisible();
  }

  @step("Select first account")
  async selectFirstAccount() {
    await this.confirmButton.waitFor({ state: "visible" });
    if (await this.deselectAllButton.isVisible()) {
      await this.deselectAllButton.click();
      await this.checkbox.click();
    }
    await this.clickConfirmButton();
    await this.expectSuccessStepVisibility();
  }

  @step("Select first account and go to the view key confirmation step")
  async selectFirstAccountAndGoToViewKeyConfirmation() {
    await this.shareViewKeyButton.waitFor({ state: "visible" });

    if (await this.deselectAllButton.isVisible()) {
      await this.deselectAllButton.click();
      await this.checkbox.click();
    }

    await expect(this.shareViewKeyButton).toBeVisible();
    await this.clickShareViewKeyButton();
    await expect(this.viewKeyConfirmationStep).toBeVisible();
  }
}
