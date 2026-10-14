import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";

// i18n `postOnboarding.dialog.actionCompletedLabel`
export const ACTION_COMPLETED_LABEL = "Complete";

const NANO_S_POST_ONBOARDING_ACTIONS = [
  PostOnboardingActionId.deviceOnboarded,
  PostOnboardingActionId.assetsTransfer,
];
const POST_ONBOARDING_ACTIONS = [
  ...NANO_S_POST_ONBOARDING_ACTIONS,
  PostOnboardingActionId.syncAccounts,
  PostOnboardingActionId.discoverWallet,
];

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

  private readonly actionRows = this.finishOnboardingDialog.getByTestId("post-onboarding-action");

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
    const row = this.actionRow(actionId);
    await expect(row).toBeVisible();
    await expect(row).not.toContainText(ACTION_COMPLETED_LABEL);
    await expect(row).toHaveAttribute("data-post-onboarding-action-completed", "false");
  }

  @step("Expect post-onboarding action $0 to be completed")
  async expectActionCompleted(actionId: string) {
    const row = this.actionRow(actionId);
    await expect(row).toBeVisible();
    await expect(row).toContainText(ACTION_COMPLETED_LABEL);
    await expect(row).toHaveAttribute("data-post-onboarding-action-completed", "true");
  }

  @step("Expect the finish-onboarding dialog to list $0")
  async expectActions(device: DeviceModelId) {
    const actionIds =
      device === DeviceModelId.nanoS ? NANO_S_POST_ONBOARDING_ACTIONS : POST_ONBOARDING_ACTIONS;
    await expect(this.finishOnboardingDialog).toBeVisible();
    await expect
      .poll(() =>
        this.actionRows.evaluateAll(rows =>
          rows.map(row => row.getAttribute("data-post-onboarding-action-id")),
        ),
      )
      .toEqual(actionIds);
    await this.expectActionCompleted(PostOnboardingActionId.deviceOnboarded);
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
