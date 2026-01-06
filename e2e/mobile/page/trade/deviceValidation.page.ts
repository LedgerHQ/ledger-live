import { Step } from "jest-allure2-reporter/api";

export default class DeviceValidationPage {
  validationScrollViewId = "device-validation-scroll-view";
  validationAmount = () => getElementById("device-validation-amount");
  validationAddress = () => getElementById("device-validation-address");
  validationProvider = () => getElementById("device-validation-provider");
  validationFees = () => getElementById("device-validation-transaction-fee");

  @Step("Expect device validation screen to be displayed")
  async expectDeviceValidationScreen() {
    await waitForElementById(this.validationScrollViewId);
  }

  @Step("Expect amount in device validation screen")
  async expectAmount(amount: string) {
    await detoxExpect(this.validationAmount()).toHaveText(amount);
  }

  @Step("Expect address in device validation screen")
  async expectAddress(recipient: string) {
    await detoxExpect(this.validationAddress()).toHaveText(recipient);
  }

  @Step("Expect provider in device validation screen")
  async expectProvider(provider: string) {
    await detoxExpect(this.validationProvider()).toHaveText(provider);
  }

  @Step("Expect fees in device validation screen")
  async expectFees(fees: string) {
    await detoxExpect(this.validationFees()).toHaveText(fees);
  }
}
