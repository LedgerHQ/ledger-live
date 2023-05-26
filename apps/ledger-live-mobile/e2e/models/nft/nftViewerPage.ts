import { getElementById, tapByElement } from "../../helpers";

export default class NftViewerPage {
  mainScrollView = () => getElementById(`nft-viewer-page-scrollview`);
  backButton = () => getElementById("navigation-header-back-button");

  async navigateToNftGallery() {
    await tapByElement(this.backButton());
  }
}
