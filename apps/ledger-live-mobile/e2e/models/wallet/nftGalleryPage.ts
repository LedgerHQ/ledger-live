import { getElementById, tapByElement } from "../../helpers";

export default class NftGalleryPage {
  nftListComponent = () => getElementById(`wallet-nft-gallery-list`);
  nftListItems = () => getElementById(`wallet-nft-gallery-list-item`);

  async navigateToNftViewer() {
    await tapByElement(this.nftListItems());
  }
}
