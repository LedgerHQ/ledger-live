import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { expectedFinishOnboardingActions } from "tests/utils/postOnboardingUtils";

export class PostOnboardingPage extends AppPage {
  private readonly finishOnboardingWidget = this.page.getByTestId("finish-onboarding-widget");
  private readonly finishOnboardingDialog = this.page
    .getByRole("dialog")
    .filter({ has: this.page.locator("[data-post-onboarding-action-id]") });
  private readonly finishOnboardingDialogCloseButton = this.page
    .getByTestId("finish-onboarding-dialog-header")
    .getByRole("button");
  private readonly sideDrawer = this.page.getByTestId("side-drawer-container");
  private readonly completeMockActionButton = this.page.getByTestId(
    "postonboarding-complete-action-button",
  );

  private readonly actionRows = this.finishOnboardingDialog.locator(
    "[data-post-onboarding-action-id]",
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

  @step("Close the finish-onboarding dialog")
  async closeFinishOnboardingDialog() {
    await expect(this.finishOnboardingDialog).toBeVisible();
    await this.finishOnboardingDialogCloseButton.click();
    await expect(this.finishOnboardingDialog).toBeHidden();
  }

  @step("Expect post-onboarding action $0 to be pending")
  async expectActionPending(actionId: string) {
    await expect(this.actionRow(actionId)).toHaveAttribute(
      "data-post-onboarding-action-completed",
      "false",
    );
  }

  @step("Expect post-onboarding action $0 to be completed")
  async expectActionCompleted(actionId: string) {
    await expect(this.actionRow(actionId)).toHaveAttribute(
      "data-post-onboarding-action-completed",
      "true",
    );
  }

  @step("Expect the finish-onboarding actions offered for $0")
  async expectActionsForDevice(device: DeviceModelId) {
    await this.expectActions(await expectedFinishOnboardingActions(this.page, device));
    await this.expectActionCompleted("deviceOnboarded");
  }

  @step("Expect the finish-onboarding dialog to list $0")
  private async expectActions(actionIds: string[]) {
    await expect(this.finishOnboardingDialog).toBeVisible();
    await expect
      .poll(() =>
        this.actionRows.evaluateAll(rows =>
          rows.map(row => row.getAttribute("data-post-onboarding-action-id")),
        ),
      )
      .toEqual(actionIds);
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
