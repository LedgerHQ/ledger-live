import { openDeeplink } from "../../helpers/commonHelpers";

export default class CustomLockscreenPage {
  baseLink = "custom-image";
  welcomeCustomImageTitle = () => getElementById("custom-image-welcome-title");
  welcomeChoosePictureButton = () => getElementById("custom-image-choose-picture-button");

  @Step("Open custom lockscreen via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Expect custom lockscreen page")
  async expectCustomLockscreenPage() {
    await detoxExpect(this.welcomeCustomImageTitle()).toBeVisible();
    await detoxExpect(this.welcomeChoosePictureButton()).toBeVisible();
  }
}
