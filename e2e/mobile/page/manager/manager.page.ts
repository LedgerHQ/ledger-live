import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";

export default class ManagerPage {
  private readonly baseLink = "myledger";
  private readonly managerTitle = byId("header-title");
  private readonly headerBackButton = byId("header-back-button");
  private readonly deviceInfo = byId("manager-deviceInfo-scrollView");

  @Step("Open manager via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Expect manager page")
  async expectManagerPage() {
    await this.managerTitle.expectVisible();
  }

  @Step("Expect My Ledger to show the device information")
  async expectDeviceInfoVisible() {
    await this.deviceInfo.waitVisible();
  }

  @Step("Go back from My Ledger to My Wallet")
  async goBackToMyWallet() {
    await this.headerBackButton.tap();
    await app.myWallet.expectScreenVisible();
  }
}
