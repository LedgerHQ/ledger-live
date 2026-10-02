import { Step } from "jest-allure2-reporter/api";
import { MockServerSessionHandle } from "@ledgerhq/live-e2e-shared/mockServer/session";

const PROMPT_VISIBLE_TIMEOUT_MS = 60_000;
const PROMPT_HIDDEN_POLL_MS = 400;

const DASHBOARD_RENAME_APDU_PREFIX = "e02e";
const EDIT_CONTACT_NAME_STRUCT = "2e";
const HMAC_NAME_HEX = "11".repeat(32);
const SUCCESS_STATUS_WORD = "9000";

export class MockServerDevicePage extends MockServerSessionHandle {
  @Step("Mock the dashboard contact rename")
  async mockDashboardRename() {
    await this.pinApduResponse(
      DASHBOARD_RENAME_APDU_PREFIX,
      `${EDIT_CONTACT_NAME_STRUCT}${HMAC_NAME_HEX}${SUCCESS_STATUS_WORD}`,
    );
  }

  @Step("Confirm the open device prompt")
  async confirmDeviceIntent(testId: string) {
    const prompt = element(by.id(testId));
    await waitFor(prompt).toBeVisible().withTimeout(PROMPT_VISIBLE_TIMEOUT_MS);
    await this.approvePromptsUntil(async () => {
      try {
        await waitFor(prompt).not.toBeVisible().withTimeout(PROMPT_HIDDEN_POLL_MS);
        return true;
      } catch {
        return false;
      }
    });
    await this.dismissCompletionStatus();
  }
}
