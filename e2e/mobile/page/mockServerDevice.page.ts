import { byId } from "@e2e/helpers/elements/native";
import { Step } from "jest-allure2-reporter/api";
import { MockServerSessionHandle } from "@ledgerhq/live-e2e-shared/mockServer/session";
import { INTERVAL } from "@e2e/utils/timeouts";

const DASHBOARD_RENAME_APDU_PREFIX = "e02e";
const EDIT_CONTACT_NAME_STRUCT = "2e";
const HMAC_NAME_HEX = "11".repeat(32);
const SUCCESS_STATUS_WORD = "9000";

export class MockServerDevicePage extends MockServerSessionHandle {
  private readonly prompt = (testId: string) => byId(testId);

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
    await prompt.waitVisible();
    await this.approvePromptsUntil(async () => !(await prompt.isVisible(INTERVAL.tick)));
    await this.dismissDeviceCompletionStatus();
  }

  @Step("Dismiss the device completion status")
  async dismissDeviceCompletionStatus() {
    await this.dismissCompletionStatus();
  }
}
