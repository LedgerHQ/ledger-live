import { expect, type Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { MockServerSessionHandle } from "@ledgerhq/live-e2e-shared/mockServer/session";

const sorted = (appNames: string[]) => [...appNames].sort();

const DASHBOARD_RENAME_APDU_PREFIX = "e02e";
const EDIT_CONTACT_NAME_STRUCT = "2e";
const HMAC_NAME_HEX = "11".repeat(32);
const SUCCESS_STATUS_WORD = "9000";

export class MockServerDevicePage extends MockServerSessionHandle {
  @step("Expect the device to report the language $0")
  async expectDeviceLanguage(language: string, timeout = 10_000) {
    await expect.poll(() => this.deviceLanguage(), { timeout }).toBe(language);
  }

  @step("Expect the device to report the apps $0 installed")
  async expectInstalledApps(appNames: string[], timeout = 10_000) {
    await expect
      .poll(async () => sorted(await this.installedApps()), { timeout })
      .toEqual(sorted(appNames));
  }

  @step("Mock the dashboard contact rename")
  async mockDashboardRename() {
    await this.pinApduResponse(
      DASHBOARD_RENAME_APDU_PREFIX,
      `${EDIT_CONTACT_NAME_STRUCT}${HMAC_NAME_HEX}${SUCCESS_STATUS_WORD}`,
    );
  }

  @step("Confirm the open device prompt")
  async confirmDeviceIntent(page: Page) {
    const dialog = page.getByTestId("device-intent-executor-dialog");
    await expect(dialog).toBeVisible();
    await this.approvePromptsUntil(() => dialog.isHidden());
    await this.dismissCompletionStatus();
  }
}
