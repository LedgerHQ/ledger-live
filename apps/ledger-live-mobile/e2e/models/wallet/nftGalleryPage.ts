import { getElementById, openDeeplink, tapByElement } from "../../helpers";
import { expect } from "detox";

const baseLink = "nftgallery";

export default class NftGalleryPage {
  root = () => getElementById("wallet-nft-gallery-screen");
  emptyScreen = () => getElementById("wallet-nft-gallery-empty");
  nftListComponent = () => getElementById(`wallet-nft-gallery-list`);
  nftAddNewListItem = () => getElementById("wallet-nft-gallery-add-new-list-item");
  receiveNftButton = () => getElementById("wallet-nft-gallery-receive-nft-button");
  nftReceiveModalContinueButton = () =>
    getElementById("wallet-nft-gallery-receive-modal-continue-button");
  nftReceiveModal = () => getElementById("wallet-nft-gallery-receive-modal");
  selectAndHide = () => getElementById("wallet-nft-gallery-select-and-hide");
  confirmHide = () => getElementById("wallet-nft-gallery-confirm-hide");
  nftListItem = (index: number) => getElementById(`wallet-nft-gallery-list-item-${index}`);

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async hideNft(index: number) {
    await expect(this.nftListItem(index)).toBeVisible();
    await tapByElement(this.selectAndHide());
    await tapByElement(this.nftListItem(index));
    await tapByElement(this.confirmHide());
    await expect(this.nftListItem(index)).not.toBeVisible();
  }

  async continueFromReceiveNFTsModal() {
    await tapByElement(this.nftReceiveModalContinueButton());
  }
}
