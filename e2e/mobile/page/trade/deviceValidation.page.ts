import CommonPage from "@e2e/page/common.page";
import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";

export default class DeviceValidationPage extends CommonPage {
  private readonly validationScrollView = byId("device-validation-scroll-view");
  private readonly validationAmount = byId("device-validation-amount");
  private readonly validationAddress = byId("device-validation-address");
  private readonly validationProvider = byId("device-validation-provider");
  private readonly validationFees = byId("device-validation-transaction-fee");

  @Step("Expect device validation screen to be displayed")
  async expectDeviceValidationScreen() {
    await this.validationScrollView.waitVisible();
  }

  @Step("Expect amount in device validation screen {{{0}}}")
  async expectAmount(amount: string) {
    await this.validationAmount.expectText(amount);
  }

  @Step("Expect address in device validation screen {{{0}}}")
  async expectAddress(recipient: string) {
    await this.validationAddress.expectText(recipient);
  }

  @Step("Expect provider in device validation screen {{{0}}}")
  async expectProvider(provider: string) {
    await this.validationProvider.expectText(provider);
  }

  @Step("Expect fees in device validation screen {{{0}}}")
  async expectFees(fees: string) {
    await this.validationFees.expectText(fees);
  }
}
