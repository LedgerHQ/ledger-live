import CommonPage from "../common.page";
import { Step } from "jest-allure2-reporter/api";
import { TIMEOUT } from "../../utils/timeouts";

export default class DeviceValidationPage extends CommonPage {
  validationScrollViewId = "device-validation-scroll-view";
  validationAmountId = "device-validation-amount";
  validationAmount = () => getElementById(this.validationAmountId);
  validationAddress = () => getElementById("device-validation-address");
  validationProvider = () => getElementById("device-validation-provider");
  validationFees = () => getElementById("device-validation-transaction-fee");

  @Step("Expect device validation screen to be displayed")
  async expectDeviceValidationScreen() {
    await waitForElementById(this.validationScrollViewId, TIMEOUT.l);
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
