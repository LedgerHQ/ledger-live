import { getElementById, waitForElementById, expect } from "../../helpers";

export default class DeviceValidationPage {
  validationScrollViewId = "device-validation-scroll-view";
  validationAmount = () => getElementById("device-validation-amount");
  validationAddress = () => getElementById("device-validation-address");
  validationProvider = () => getElementById("device-validation-provider");

  @Step("Expect device validation screen to be displayed")
  async expectDeviceValidationScreen() {
    await waitForElementById(this.validationScrollViewId);
  }

  @Step("Expect amount in device validation screen")
  async expectAmount(amount: string) {
    await expect(this.validationAmount()).toHaveText(amount);
  }

  @Step("Expect address in device validation screen")
  async expectAddress(recipient: string) {
    await expect(this.validationAddress()).toHaveText(recipient);
  }

  @Step("Expect provider in device validation screen")
  async expectProvider(provider: string) {
    await expect(this.validationProvider()).toHaveText(provider);
  }
}
