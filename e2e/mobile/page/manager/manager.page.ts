import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";

export default class ManagerPage {
  private readonly baseLink = "myledger";
  private readonly managerTitle = byId("header-title");

  @Step("Open manager via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Expect manager page")
  async expectManagerPage() {
    await this.managerTitle.expectVisible();
  }
}
