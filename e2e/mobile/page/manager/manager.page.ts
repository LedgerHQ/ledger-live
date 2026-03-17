import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class ManagerPage {
  baseLink = "myledger";
  // TODO - remove `or` statement when wallet40 is fully activated
  managerTitleId = /manager-title|header-title/;
  deviceNameId = "manager-device-name";

  deviceName = () => getElementById(this.deviceNameId);

  @Step("Open manager via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Expect manager page")
  async expectManagerPage() {
    await detoxExpect(getElementById(this.managerTitleId)).toBeVisible();
  }
}
