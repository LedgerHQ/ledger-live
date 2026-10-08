import { by, element, waitFor } from "detox";
import { Step } from "jest-allure2-reporter/api";
import { MockServerSessionHandle } from "@ledgerhq/live-e2e-shared/mockServer/session";
import { INTERVAL, TIMEOUT } from "@e2e/utils/timeouts";

const DASHBOARD_RENAME_APDU_PREFIX = "e02e";
const EDIT_CONTACT_NAME_STRUCT = "2e";
const HMAC_NAME_HEX = "11".repeat(32);
const SUCCESS_STATUS_WORD = "9000";

export class MockServerDevicePage extends MockServerSessionHandle {
  prompt = (testId: string) => element(by.id(testId));

  @Step("Mock the dashboard contact rename")
  async mockDashboardRename() {
    await this.pinApduResponse(
      DASHBOARD_RENAME_APDU_PREFIX,
      `${EDIT_CONTACT_NAME_STRUCT}${HMAC_NAME_HEX}${SUCCESS_STATUS_WORD}`,
    );
  }

  @Step("Confirm the open device prompt")
  async confirmDeviceIntent(testId: string) {
    const prompt = this.prompt(testId);
    await waitFor(prompt).toBeVisible().withTimeout(TIMEOUT.xxlarge);
    await this.approvePromptsUntil(async () => {
      try {
        await waitFor(prompt).not.toBeVisible().withTimeout(INTERVAL.tick);
        return true;
      } catch {
        return false;
      }
    });
    await this.dismissDeviceCompletionStatus();
  }

  @Step("Dismiss the device completion status")
  async dismissDeviceCompletionStatus() {
    await this.dismissCompletionStatus();
  }

  @Step("Approve the device until the contact is renamed to {{0}}")
  async approveUntilRenameSettled(name: string) {
    const pending = this.prompt("contacts-rename-contact-pending");
    const detailName = this.prompt("contacts-detail-name");
    // The detail name updates before the preparing sheet mounts, so the first poll cannot be the success.
    let skippedOpeningPoll = false;

    await this.approvePromptsUntil(async () => {
      if (!skippedOpeningPoll) {
        skippedOpeningPoll = true;
        return false;
      }

      try {
        await waitFor(pending).not.toBeVisible().withTimeout(INTERVAL.tick);
        await waitFor(detailName).toHaveText(name).withTimeout(INTERVAL.tick);
        return true;
      } catch {
        return false;
      }
    });
    await this.dismissDeviceCompletionStatus();
  }
}
