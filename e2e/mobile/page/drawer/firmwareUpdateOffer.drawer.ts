import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

/** The drawer that offers a firmware update during the device checks. */
export default class FirmwareUpdateOfferDrawer {
  private readonly content = byId("firmware-update-available-drawer");
  private readonly updateButton = byId("firmware-update-available-drawer-update");
  private readonly closeButton = byId("modal-close-button");

  @Step("Expect the firmware update offer")
  async expectVisible() {
    await this.content.waitFullyVisible(TIMEOUT.xxlarge);
  }

  @Step("Accept the firmware update")
  async accept() {
    await waitForIosTransitionEnd();
    await this.updateButton.tap();
  }

  @Step("Dismiss the firmware update offer")
  async dismiss() {
    await waitForIosTransitionEnd();
    await this.closeButton.tap();
    await this.content.waitNotVisible();
  }
}
