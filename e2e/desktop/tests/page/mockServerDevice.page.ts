import { expect, type Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { MockServerSessionHandle } from "@ledgerhq/live-e2e-shared/mockServer/session";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

const sorted = (appNames: string[]) => [...appNames].sort();

const DASHBOARD_RENAME_APDU_PREFIX = "e02e";
const EDIT_CONTACT_NAME_STRUCT = "2e";
const HMAC_NAME_HEX = "11".repeat(32);
const SUCCESS_STATUS_WORD = "9000";

const CUSTOM_IMAGE_SIZE_APDU_PREFIX = "e064";
const CUSTOM_IMAGE_REMOVE_APDU_PREFIX = "e063";
const CUSTOM_IMAGE_SIZE_HEX = "0000d50b";

export class MockServerDevicePage extends MockServerSessionHandle {
  @step("Expect the device to report the language $0")
  async expectDeviceLanguage(language: string, timeout = TIMEOUT.medium) {
    await expect.poll(() => this.deviceLanguage(), { timeout }).toBe(language);
  }

  @step("Expect the device to report the apps $0 installed")
  async expectInstalledApps(appNames: string[], timeout = TIMEOUT.medium) {
    await expect
      .poll(async () => sorted(await this.installedApps()), { timeout })
      .toEqual(sorted(appNames));
  }

  @step("Expect the device to report the name $0")
  async expectDeviceName(name: string, timeout = TIMEOUT.medium) {
    await expect.poll(() => this.deviceName(), { timeout }).toBe(name);
  }

  @step("Mock the dashboard contact rename")
  async mockDashboardRename() {
    await this.pinApduResponse(
      DASHBOARD_RENAME_APDU_PREFIX,
      `${EDIT_CONTACT_NAME_STRUCT}${HMAC_NAME_HEX}${SUCCESS_STATUS_WORD}`,
    );
  }

  /** The mock server does not store a loaded lock screen, so its presence is pinned. */
  @step("Mock a custom lock screen on the device")
  async mockCustomLockScreenPresent() {
    await this.pinApduResponse(
      CUSTOM_IMAGE_SIZE_APDU_PREFIX,
      `${CUSTOM_IMAGE_SIZE_HEX}${SUCCESS_STATUS_WORD}`,
    );
    await this.pinApduResponse(CUSTOM_IMAGE_REMOVE_APDU_PREFIX, SUCCESS_STATUS_WORD);
  }

  @step("Confirm the open device prompt")
  async confirmDeviceIntent(page: Page) {
    const dialog = page.getByTestId("device-intent-executor-dialog");
    await expect(dialog).toBeVisible();
    await this.approvePromptsUntil(() => dialog.isHidden());
    await this.dismissCompletionStatus();
  }
}
