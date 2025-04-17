import { expect } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class CustomLockscreenPage {
  baseLink = "custom-image";
  welcomeCustomImageTitle = () => getElementById("custom-image-welcome-title");
  welcomeChoosePictureButton = () => getElementById("custom-image-choose-picture-button");

  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  async expectCustomLockscreenPage() {
    await expect(await this.welcomeCustomImageTitle()).toBeVisible();
    await expect(await this.welcomeChoosePictureButton()).toBeVisible();
  }
}
