import { getElementById, tapByElement, getElementByText } from "../../helpers";

export default class NftGalleryPage {
  nftListComponent = () => getElementById(`wallet-nft-gallery-list`);
  nftListItems = () => getElementById(`wallet-nft-gallery-list-item`);
  nftAddNewListItem = () =>
    getElementById(`wallet-nft-gallery-add-new-list-item`);
  nftReceiveModalContinueButton = () =>
    getElementById(`wallet-nft-gallery-receive-modal-continue-button`);
  nftReceiveModal = () => getElementById(`wallet-nft-gallery-receive-modal`);

  async navigateToNftViewer() {
    await tapByElement(this.nftListItems());
  }

  async openRecevieNFTsModal() {
    await tapByElement(this.nftAddNewListItem());
  }

  async continueFromReceiveNFTsModal() {
    await tapByElement(this.nftReceiveModalContinueButton());
  }
}
