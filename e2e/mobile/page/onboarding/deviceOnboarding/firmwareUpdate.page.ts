import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

export default class FirmwareUpdatePage {
  private readonly releaseNotes = byId("firmware-update-release-notes");

  @Step("Expect the firmware update screen")
  async expectVisible() {
    await this.releaseNotes.waitVisible(TIMEOUT.xlarge);
  }
}
