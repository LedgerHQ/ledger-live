import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import type { OnboardingDeviceId } from "tests/page/onboarding.page";

export class SyncOnboardingPage extends AppPage {
  private readonly genuineCheckButton = this.page.getByRole("button", { name: /^Check Ledger/i });
  private readonly genuineCheckSuccess = this.page.getByText(/is genuine$/i);
  private readonly osUpToDate = this.page.getByText(/Ledger OS is up to date/i);
  private readonly osUpdateAvailable = this.page.getByText(/OS update .* available/i);
  private readonly osUpdateButton = this.page.getByRole("button", { name: /Update Ledger .* OS/i });
  private readonly continueToSetupButton = this.page.getByRole("button", {
    name: /Continue to setup/i,
  });
  private readonly newSeedStep = this.page.getByTestId("new-seed-step");
  private readonly successStep = this.page.getByTestId("sync-onboarding-success-step");
  private readonly fundNewSeed = this.page.getByTestId("onboarding-fund-new-seed");
  private readonly syncStepCta = this.page.getByTestId("onboarding-sync");
  private readonly syncSkipLink = this.page
    .locator('*:has(> [data-testid="onboarding-sync"])')
    .getByTestId("skip-cta-button");
  private readonly confirmSkipSyncButton = this.page.getByTestId(
    "onboarding-sync-skip-confirmSkip",
  );
  private readonly maybeLaterButton = this.page
    .locator('*:has(> [data-testid="onboarding-fund-new-seed"])')
    .getByTestId("skip-cta-button");
  private readonly completionView = (device: OnboardingDeviceId) =>
    this.page.getByTestId(`${device}-completion-view`);

  @step("Expect the companion to be reached for $0")
  async expectCompanionReached(device: OnboardingDeviceId) {
    await expect(this.page).toHaveURL(new RegExp(`/onboarding/sync/manual/${device}$`));
  }

  @step("Run the genuine check")
  async runGenuineCheck() {
    await this.genuineCheckButton.click();
  }

  @step("Expect the device to be reported genuine")
  async expectDeviceGenuine() {
    await expect(this.genuineCheckSuccess).toBeVisible();
  }

  @step("Expect the OS to be up to date")
  async expectOsUpToDate() {
    await expect(this.osUpToDate).toBeVisible();
  }

  @step("Expect an OS update to be offered")
  async expectOsUpdateOffered() {
    await expect(this.osUpdateAvailable).toBeVisible();
    await expect(this.osUpdateButton).toBeVisible();
  }

  @step("Continue to setup")
  async continueToSetup() {
    await this.continueToSetupButton.click();
  }

  @step("Expect the new-seed path to be shown")
  async expectNewSeedPath() {
    await expect(this.newSeedStep).toBeVisible();
  }

  @step("Skip the wallet sync step")
  async skipWalletSync() {
    await expect(this.syncStepCta).toBeVisible();
    await this.syncSkipLink.click();
    await this.confirmSkipSyncButton.click();
  }

  @step("Expect the device setup to complete")
  async expectSetupComplete() {
    // The mock server advances PIN and Secret Recovery Phrase as the companion polls it.
    await expect(this.successStep).toBeVisible();
  }

  @step("Expect the end of onboarding")
  async expectOnboardingComplete() {
    await expect(this.fundNewSeed).toBeVisible();
  }

  @step("Decline funding the wallet for now")
  async declineFunding() {
    await this.maybeLaterButton.click();
  }

  @step("Expect the completion screen for $0")
  async expectCompletionScreen(device: OnboardingDeviceId) {
    await expect(this.completionView(device)).toBeVisible();
  }
}
