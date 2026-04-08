import CommonPage from "../common.page";
import { delay } from "../../helpers/commonHelpers";
import { Step } from "jest-allure2-reporter/api";

export default class DeviceValidationPage extends CommonPage {
  validationScrollViewId = "device-validation-scroll-view";
  validationAmountId = "device-validation-amount";
  validationAmount = () => getElementById(this.validationAmountId);
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

  @Step("Wait for swap device validation and retry")
  async waitDeviceValidationAndRetry() {
    const WAIT_TIMEOUT = 30000;
    const CHECK_INTERVAL = 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < WAIT_TIMEOUT) {
      if (await IsIdVisible(this.validationAmountId, 100)) {
        return;
      }
      if (await IsIdVisible(this.proceedButtonId, 100)) {
        await tapById(this.proceedButtonId);
        return;
      }
      await delay(CHECK_INTERVAL);
    }

    throw new Error(`Device validation timed out after ${WAIT_TIMEOUT / 1000} seconds.`);
  }
}
