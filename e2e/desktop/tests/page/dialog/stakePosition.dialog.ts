import { expect } from "@playwright/test";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";
import { Dialog } from "tests/component/dialog.component";
import { step } from "tests/misc/reporters/step";

/** The figures of the details, formatted as the app shows them. */
export type StakePositionFigures = {
  totalRewards: string;
  currentBalance: string;
  initialDeposit: string;
  apyBadge: string;
  status: string;
  validatorName: string;
};

/**
 * The buttons of the dialog have no test id, and two screens show both "Deactivate" and "Try
 * again": each button is found by role and name inside its screen. The device step opens a second
 * dialog over this one, so nothing here goes through the base `content`.
 */
export class StakePositionDialog extends Dialog {
  private readonly dialog = this.page.getByTestId("stake-position-dialog");
  private readonly details = this.dialog.getByTestId("stake-position-details");
  private readonly rewards = this.details.getByTestId("stake-position-rewards");
  private readonly confirmation = this.dialog.getByTestId("stake-position-confirm");
  private readonly unavailable = this.dialog.getByTestId("stake-position-unavailable");
  private readonly deviceStep = this.page
    .getByTestId("device-intent-executor-dialog")
    .getByTestId("stake-position-signature-continue");
  // Exact names, since a loading button is also named after its spinner.
  private readonly deactivateButton = this.details.getByRole("button", {
    name: "Deactivate",
    exact: true,
  });
  private readonly confirmDeactivateButton = this.confirmation.getByRole("button", {
    name: "Deactivate",
    exact: true,
  });
  private readonly tryAgainButton = this.dialog.getByRole("button", {
    name: "Try again",
    exact: true,
  });
  private readonly loadErrorTitle = this.unavailable.getByRole("heading", {
    name: "We couldn't load this position",
  });
  private readonly detailsFigure = (text: string) => this.details.getByText(text, { exact: true });

  @step("Expect the stake position details to show the mocked figures")
  async expectDetailsVisible(figures: StakePositionFigures) {
    await expect(this.details).toBeVisible();
    await expect(this.rewards.getByText(figures.totalRewards, { exact: true })).toBeVisible();
    await expect(this.detailsFigure(figures.currentBalance)).toBeVisible();
    await expect(this.detailsFigure(figures.initialDeposit)).toBeVisible();
    await expect(this.detailsFigure(figures.apyBadge)).toBeVisible();
    await expect(this.detailsFigure(figures.status)).toBeVisible();
    await expect(this.detailsFigure(figures.validatorName)).toBeVisible();
  }

  @step("Click `Deactivate` in the stake position details")
  async clickDeactivate() {
    // Disabled while the account syncs: the dialog syncs it when its data is over a minute old.
    await expect(this.deactivateButton).toBeEnabled({ timeout: TIMEOUT.xxlarge });
    await this.deactivateButton.click();
  }

  @step("Confirm the deactivation")
  async confirmDeactivation() {
    await expect(this.confirmation).toBeVisible();
    await expect(this.confirmDeactivateButton).toBeEnabled();
    await this.confirmDeactivateButton.click();
  }

  @step("Expect the device step of the stake position")
  async expectDeviceStep() {
    await expect(this.deviceStep).toBeVisible({ timeout: TIMEOUT.xlarge });
  }

  @step("Expect the stake position load error")
  async expectErrorState() {
    await expect(this.loadErrorTitle).toBeVisible();
  }

  @step("Click `Try again` in the stake position dialog")
  async clickTryAgain() {
    await this.tryAgainButton.click();
  }
}
