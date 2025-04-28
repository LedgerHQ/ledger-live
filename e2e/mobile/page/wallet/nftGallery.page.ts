import { expect } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class NftGalleryPage {
  baseLink = "nftgallery";
  root = () => getElementById("wallet-nft-gallery-screen");
  emptyScreen = () => getElementById("wallet-nft-gallery-empty");
  emptyScreenResetButton = () => getElementById("wallet-nft-gallery-empty-reset-button");
  nftListPrefix = "wallet-nft-gallery-list-";
  nftListRegexp = new RegExp(`^${this.nftListPrefix}.`);
  nftListComponent = () => getElementById(this.nftListRegexp);
  nftAddNewListItem = () => getElementById("wallet-nft-gallery-add-new-list-item");
  receiveNftButton = () => getElementById("wallet-nft-gallery-receive-nft-button");
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
    await tapByElement(await this.nftListItem(index));
  }

  async hideNft(index = 0) {
    await expect(await this.nftListItem(index)).toBeVisible();
    await tapByElement(await this.selectAndHide());
    await tapByElement(await this.nftListItem(index));
    await tapByElement(await this.confirmHide());
    await expect(await this.nftListItem(index)).not.toBeVisible();
  }

  @Step("Hide All Nft")
  async hideAllNft() {
    // Get total number of NFTs given by the list identifier
    const nftNumber = Number.parseInt(
      (await getIdByRegexp(this.nftListRegexp)).replace(this.nftListPrefix, ""),
    );

    // Select all NFTs and confirm hidding
    await tapByElement(await this.selectAndHide());
    for (let nb = nftNumber; nb > 0; nb--) await this.clickOnNft(nb - 1);
    await tapByElement(await this.confirmHide());

    // Expect no NFT displayed
    await expect(await this.nftListItem()).not.toBeVisible();
  }

  async continueFromReceiveNFTsModal() {
    await tapByElement(await this.nftReceiveModalContinueButton());
  }

  @Step("Wait for NFT list")
  async waitForList() {
    await waitForElementById(this.nftListRegexp);
  }

  @Step("Expect NFT Gallery visible")
  async expectGalleryVisible() {
    await expect(await this.root()).toBeVisible();
  }

  @Step("Expect NFT Gallery not visible")
  async expectGalleryNotVisible() {
    await expect(await this.root()).not.toBeVisible();
  }

  @Step("Expect Gallery empty state")
  async expectGalleryEmptyState() {
    await this.expectGalleryVisible();
    await expect(await this.emptyScreen()).toBeVisible(50);
  }

  @Step("Expect NFT visible")
  async expectNftVisible(index = 0) {
    await expect(await this.nftListItem(index)).toBeVisible();
  }

  @Step("Expect Filter drawer to be visible")
  async expectFilterDrawerVisible() {
    await expect(await this.nftFilterDrawer()).toBeVisible();
  }

  @Step("Expect Filter Drawer not to be visible")
  async expectFilterDrawerNotVisible() {
    await expect(await this.nftFilterDrawer()).not.toBeVisible();
  }

  @Step("Click on reset filters")
  async tapResetFilters() {
    await tapByElement(await this.emptyScreenResetButton());
  }

  @Step("Click on Add new NFT")
  async tapAddNew() {
    await tapByElement(await this.nftAddNewListItem());
  }

  @Step("Expect NFT receive modal visible")
  async expectNftReceiveModalVisible() {
    await expect(await this.nftReceiveModal()).toBeVisible();
  }
}
