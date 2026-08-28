import CommonPage from "@e2e/page/common.page";
import { Step } from "jest-allure2-reporter/api";

export default class DeviceValidationPage extends CommonPage {
  validationScrollViewId = "device-validation-scroll-view";
  private validationFees = () => getElementById("device-validation-transaction-fee");

  @Step("Expect device validation screen to be displayed")
  async expectDeviceValidationScreen() {
    await waitForElementById(this.validationScrollViewId);
  }

  @Step("Expect fees in device validation screen {{{0}}}")
  async expectFees(fees: string) {
    await detoxExpect(this.validationFees()).toHaveText(fees);
  }
}
