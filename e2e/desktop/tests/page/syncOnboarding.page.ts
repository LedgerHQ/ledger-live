import { expect, type Locator } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import type { DeviceModelId } from "@ledgerhq/live-e2e-shared/mockServer";

/**
 * The sync onboarding companion (`/onboarding/sync/manual/:deviceModelId`), driven
 * against an emulated device. Its steps advance as the device is polled, so each
 * assertion waits on the companion rather than following a fixed script.
 */
/** Resolves with `outcome` once the locator is visible, or "timeout" if it never is. */
async function appeared<T extends string>(locator: Locator, outcome: T) {
  try {
    await locator.waitFor({ state: "visible" });
    return outcome;
  } catch {
    return "timeout" as const;
  }
}

export class SyncOnboardingPage extends AppPage {
  private readonly genuineCheckButton = this.page.getByRole("button", { name: /^Check Ledger/i });
  private readonly genuineCheckSuccess = this.page.getByText(/is genuine$/i);
  private readonly osUpToDate = this.page.getByText(/Ledger OS is up to date/i);
  private readonly continueToSetupButton = this.page.getByRole("button", {
    name: /Continue to setup/i,
  });
  private readonly newSeedStep = this.page.getByTestId("new-seed-step");
  private readonly restoreSeedStep = this.page.getByTestId("restore-seed-step");
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
  private readonly installAppsButton = this.page.getByTestId("install-cta-button");
  private readonly skipAppsLink = this.page
    .locator('*:has(> [data-testid="install-cta-button"])')
    .getByTestId("skip-cta-button");
  private readonly completionView = (device: DeviceModelId) =>
    this.page.getByTestId(`${device}-completion-view`);

  @step("Expect the companion to be reached for $0")
  async expectCompanionReached(device: DeviceModelId) {
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

  @step("Continue to setup")
  async continueToSetup() {
    await this.continueToSetupButton.click();
  }

  @step("Expect the new-seed path to be shown")
  async expectNewSeedPath() {
    await expect(this.newSeedStep).toBeVisible();
  }

  /**
   * An already-initialised device keeps the PIN and seed it came with, so the companion
   * advances past the seed step without ever rendering either seed path.
   *
   * Raced against the next step rather than asserted with `toBeHidden`: the seed panels
   * take a moment to render, so a plain hidden check passes vacuously before they would
   * have appeared, and the mock server then auto-advances a fresh device through them
   * within a couple of seconds — making any fixed wait unreliable too.
   */
  @step("Expect no seed step to be forced")
  async expectSeedStepsSkipped() {
    const winner = await Promise.race([
      appeared(this.newSeedStep, "seed"),
      appeared(this.restoreSeedStep, "seed"),
      appeared(this.syncStepCta, "advanced"),
    ]);

    expect(winner, "a seed step was shown for an already-initialised device").toBe("advanced");
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

  /** Offered in place of the funding panel when the device already holds a seed. */
  @step("Expect the app installation step to be offered")
  async expectAppInstallOffered() {
    await expect(this.installAppsButton).toBeVisible();
  }

  @step("Decline installing apps for now")
  async declineAppInstall() {
    await this.skipAppsLink.click();
  }

  @step("Expect the completion screen for $0")
  async expectCompletionScreen(device: DeviceModelId) {
    await expect(this.completionView(device)).toBeVisible();
  }
}
