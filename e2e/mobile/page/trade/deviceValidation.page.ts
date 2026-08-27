import CommonPage from "@e2e/page/common.page";
import { Step } from "jest-allure2-reporter/api";

export default class DeviceValidationPage extends CommonPage {
  validationScrollViewId = "device-validation-scroll-view";

  @Step("Expect device validation screen to be displayed")
  async expectDeviceValidationScreen() {
    await waitForElementById(this.validationScrollViewId);
  }
}
