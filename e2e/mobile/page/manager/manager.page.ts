import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";

export default class ManagerPage {
  private readonly baseLink = "myledger";
  // TODO - remove `or` statement when wallet40 is fully activated
  private readonly managerTitle = byId(/manager-title|header-title/);

  @Step("Open manager via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Expect manager page")
  async expectManagerPage() {
    await this.managerTitle.expectVisible();
  }
}
