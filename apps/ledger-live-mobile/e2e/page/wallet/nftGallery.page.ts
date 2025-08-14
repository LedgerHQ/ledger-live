import { expect } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class NftGalleryPage {
  baseLink = "nftgallery";
  root = () => getElementById("wallet-nft-gallery-screen");
  emptyScreen = () => getElementById("wallet-nft-gallery-empty");
  emptyScreenResetButton = () => getElementById("wallet-nft-gallery-empty-reset-button");
  nftListPrefix = "wallet-nft-gallery-list-";
  nftListRegexp = new RegExp(`^${this.nftListPrefix}.`);
  nftAddNewListItem = () => getElementById("wallet-nft-gallery-add-new-list-item");
  nftReceiveModalContinueButton = () =>
    getElementById("wallet-nft-gallery-receive-modal-continue-button");
  nftReceiveModal = () => getElementById("wallet-nft-gallery-receive-modal");
  nftFilterDrawer = () => getElementById("wallet-nft-gallery-filter-drawer");
  selectAndHide = () => getElementById("wallet-nft-gallery-select-and-hide");
  confirmHide = () => getElementById("wallet-nft-gallery-confirm-hide");
  nftListItemId = (index = 0) => `wallet-nft-gallery-list-item-${index}`;
  nftListItem = (index = 0) => getElementById(this.nftListItemId(index));

  @Step("Open NFT Gallery via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Select NFT")
  async clickOnNft(index = 0) {
    await tapByElement(this.nftListItem(index));
  }

  async hideNft(index = 0) {
    await expect(this.nftListItem(index)).toBeVisible();
    await tapByElement(this.selectAndHide());
    await tapByElement(this.nftListItem(index));
    await tapByElement(this.confirmHide());
    await expect(this.nftListItem(index)).not.toBeVisible();
  }

  async continueFromReceiveNFTsModal() {
    await tapByElement(this.nftReceiveModalContinueButton());
  }

  @Step("Wait for NFT list")
  async waitForList() {
    await waitForElementById(this.nftListRegexp);
  }

  @Step("Expect NFT Gallery visible")
  async expectGalleryVisible() {
    await expect(this.root()).toBeVisible();
  }

  @Step("Expect NFT Gallery not visible")
  async expectGalleryNotVisible() {
    await expect(this.root()).not.toBeVisible();
  }

  @Step("Expect Gallery empty state")
  async expectGalleryEmptyState() {
    await this.expectGalleryVisible();
    await expect(this.emptyScreen()).toBeVisible(50);
  }

  @Step("Expect NFT visible")
  async expectNftVisible(index = 0) {
    await expect(this.nftListItem(index)).toBeVisible();
  }

  @Step("Expect Filter drawer to be visible")
  async expectFilterDrawerVisible() {
    await expect(this.nftFilterDrawer()).toBeVisible();
  }

  @Step("Expect Filter Drawer not to be visible")
  async expectFilterDrawerNotVisible() {
    await expect(this.nftFilterDrawer()).not.toBeVisible();
  }

  @Step("Expect NFT receive modal visible")
  async expectNftReceiveModalVisible() {
    await expect(this.nftReceiveModal()).toBeVisible();
  }
}
