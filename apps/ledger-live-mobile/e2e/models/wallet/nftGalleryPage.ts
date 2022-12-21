import { getElementById, tapByElement } from "../../helpers";

export default class NftGalleryPage {
  getNftList = () => getElementById(`wallet-nft-gallery-list`);
  getNftListItems = () => getElementById(`wallet-nft-gallery-list-item`);
  navigateToNftViewer = () => tapByElement(this.getNftListItems());
}
