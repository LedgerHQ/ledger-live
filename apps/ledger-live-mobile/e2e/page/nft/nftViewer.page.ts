import { getElementById, tapByElement } from "../../helpers";
import { expect } from "detox";

export default class NftViewerPage {
  mainScrollView = () => getElementById("nft-viewer-page-scrollview");
  backButton = () => getElementById("navigation-header-back-button");

  @Step("Navigate back to NFT gallery")
  async navigateToNftGallery() {
    await tapByElement(this.backButton());
  }

  @Step("Expect NFT viewer page to be visible")
  async expectVisible() {
    await expect(this.mainScrollView()).toBeVisible();
  }
}
