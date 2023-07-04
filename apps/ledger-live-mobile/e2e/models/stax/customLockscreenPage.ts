import { getElementById, openDeeplink } from "../../helpers";
import { expect } from "detox";

const baseLink = "custom-image";

export default class CustomLockscreenPage {
  welcomeCustomImageTitle = () => getElementById("custom-image-welcome-title");
  welcomeChoosePictureButton = () => getElementById("custom-image-choose-picture-button");

  openViaDeeplink() {
    return openDeeplink(baseLink);
  }

  expectCustomLockscreenPage() {
    return expect(this.welcomeCustomImageTitle()).toBeVisible();
  }
}
