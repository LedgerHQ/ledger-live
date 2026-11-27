import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

export default class ConnectDevicePage {
  private readonly deviceSelectButton = byId(/^connect-new-device-select-.+$/);

  @Step("Expect the Connect screen to list a device")
  async expectDeviceListed() {
    await this.deviceSelectButton.waitFullyVisible(TIMEOUT.xlarge);
  }

  @Step("Select the discovered device")
  async selectDevice() {
    await waitForIosTransitionEnd();
    await this.deviceSelectButton.tap(TIMEOUT.xlarge);
  }
}
