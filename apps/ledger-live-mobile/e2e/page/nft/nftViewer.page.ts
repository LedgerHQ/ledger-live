import { getElementById, tapByElement } from "../../helpers";
import { expect } from "detox";

export default class NftViewerPage {
  mainScrollView = () => getElementById("nft-viewer-page-scrollview");
  backButton = () => getElementById("navigation-header-back-button");

  async navigateToNftGallery() {
    await tapByElement(this.backButton());
  }

  async expectVisible() {
    await expect(this.mainScrollView()).toBeVisible();
  }
}
