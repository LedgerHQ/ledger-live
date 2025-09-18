import { openDeeplink } from "../../helpers/commonHelpers";

export default class ManagerPage {
  baseLink = "myledger";
  managerTitleId = "manager-title";
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
