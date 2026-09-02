import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";

export class PostOnboardingPage extends AppPage {
  private readonly finishOnboardingWidget = this.page.getByTestId("finish-onboarding-widget");
  private readonly finishOnboardingDialog = this.page
    .getByRole("dialog")
    .filter({ has: this.page.locator("[data-post-onboarding-action-id]") });
  private readonly sideDrawer = this.page.getByTestId("side-drawer-container");
  private readonly completeMockActionButton = this.page.getByTestId(
    "postonboarding-complete-action-button",
  );

  private actionRow(actionId: string) {
    return this.finishOnboardingDialog.locator(`[data-post-onboarding-action-id="${actionId}"]`);
  }

  @step("Expect finish-onboarding widget to be visible")
  async expectWidgetVisible() {
    await expect(this.finishOnboardingWidget).toBeVisible();
  }

  @step("Expect finish-onboarding widget to be hidden")
  async expectWidgetHidden() {
    await expect(this.finishOnboardingWidget).toBeHidden();
  }

  @step("Open finish-onboarding dialog from widget")
  async openDialogFromWidget() {
    await this.finishOnboardingWidget.click();
    await expect(this.finishOnboardingDialog).toBeVisible();
  }

  @step("Expect post-onboarding action $0 to be pending")
  async expectActionPending(actionId: string) {
    await expect(this.actionRow(actionId)).toBeVisible();
  }

  @step("Expect post-onboarding action $0 to be completed")
  async expectActionCompleted(actionId: string, completedLabel: string) {
    const row = this.actionRow(actionId);
    await expect(row).toBeVisible();
    await expect(row).toContainText(completedLabel);
  }

  @step("Click post-onboarding action $0")
  async clickAction(actionId: string) {
    await this.actionRow(actionId).click();
    await expect(this.finishOnboardingDialog).toBeHidden();
    await expect(this.completeMockActionButton).toBeVisible();
  }

  @step("Complete mock post-onboarding action")
  async completeMockAction() {
    await this.completeMockActionButton.click();
    await expect(this.sideDrawer).toBeHidden();
  }
}
