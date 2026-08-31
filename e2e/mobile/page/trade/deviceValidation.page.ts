import CommonPage from "@e2e/page/common.page";
import { Step } from "jest-allure2-reporter/api";

export default class DeviceValidationPage extends CommonPage {
  validationScrollViewId = "device-validation-scroll-view";
  private readonly validationAmount = () => getElementById("device-validation-amount");
  private readonly validationAddress = () => getElementById("device-validation-address");
  private readonly validationProvider = () => getElementById("device-validation-provider");
  private readonly validationFees = () => getElementById("device-validation-transaction-fee");

  @Step("Expect device validation screen to be displayed")
  async expectDeviceValidationScreen() {
    await waitForElementById(this.validationScrollViewId);
  }

  @Step("Expect amount in device validation screen {{{0}}}")
  async expectAmount(amount: string) {
    await detoxExpect(this.validationAmount()).toHaveText(amount);
  }

  @Step("Expect address in device validation screen {{{0}}}")
  async expectAddress(recipient: string) {
    await detoxExpect(this.validationAddress()).toHaveText(recipient);
  }

  @Step("Expect provider in device validation screen {{{0}}}")
  async expectProvider(provider: string) {
    await detoxExpect(this.validationProvider()).toHaveText(provider);
  }

  @Step("Expect fees in device validation screen {{{0}}}")
  async expectFees(fees: string) {
    await detoxExpect(this.validationFees()).toHaveText(fees);
  }
}
