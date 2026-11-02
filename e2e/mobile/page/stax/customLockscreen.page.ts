import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";

export default class CustomLockscreenPage {
  private readonly baseLink = "custom-image";
  private readonly welcomeCustomImageTitle = byId("custom-image-welcome-title");
  private readonly welcomeChoosePictureButton = byId("custom-image-choose-picture-button");

  @Step("Open custom lockscreen via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Expect custom lockscreen page")
  async expectCustomLockscreenPage() {
    await this.welcomeCustomImageTitle.expectVisible();
    await this.welcomeChoosePictureButton.expectVisible();
  }
}
