import { getElementById, waitForElementById } from "../../helpers";
import { expect } from "detox";

export default class DeviceValidationPage {
  validationAmountId = "device-validation-amount";
  validationAddressId = "device-validation-address";
  validationProviderId = "device-validation-provider";

  @Step("Expect amount in device validation screen")
  async expectAmount(amount: string) {
    await waitForElementById(this.validationAmountId);
    await expect(getElementById(this.validationAmountId)).toHaveText(amount);
  }

  @Step("Expect address in device validation screen")
  async expectAddress(recipient: string) {
    await waitForElementById(this.validationAddressId);
    await expect(getElementById(this.validationAddressId)).toHaveText(recipient);
  }

  @Step("Expect provider in device validation screen")
  async expectProvider(provider: string) {
    await waitForElementById(this.validationProviderId);
    await expect(getElementById(this.validationProviderId)).toHaveText(provider);
  }
}
