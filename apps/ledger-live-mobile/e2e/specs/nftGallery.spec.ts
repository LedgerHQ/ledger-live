import { expect } from "detox";
import { tapByElement, tapByText, waitForElementById } from "../helpers";
import { Application } from "../page";

let app: Application;

// To-Do Fix NFT not available in account
describe.skip("NFT Gallery screen", () => {
  beforeAll(async () => {
    app = await Application.init("1Account1NFTNotSpam");

    await app.portfolio.waitForPortfolioPageToLoad();
    await app.nftGallery.openViaDeeplink();
  });

  it("should see NFT tab", async () => {
    await expect(app.walletTabNavigator.nftGalleryTab()).toBeVisible();
  });

  it("should navigate to portfolio page on tab press", async () => {
    await app.walletTabNavigator.navigateToPortfolio();
    await expect(app.nftGallery.root()).not.toBeVisible();
  });

  $TmsLink("B2CQA-132");
  it("should navigate back to NFT gallery on tab press", async () => {
    await app.walletTabNavigator.navigateToNftGallery();
    await expect(app.nftGallery.root()).toBeVisible();
  });

  $TmsLink("B2CQA-132");
  it("should have a list of NFTs", async () => {
    await waitForElementById(app.nftGallery.nftListComponentId);
    await expect(app.nftGallery.nftListComponent()).toBeVisible();
    await expect(app.nftGallery.nftListItem(0)).toBeVisible();
  });

  it("should navigate to NFT viewer page on NFT gallery item press", async () => {
    await tapByElement(app.nftGallery.nftListItem(0));
    await expect(app.nftViewer.mainScrollView()).toBeVisible();
  });

  it("should navigate back to NFT gallery on back button press", async () => {
    await expect(app.nftGallery.nftListComponent()).not.toBeVisible();
    await app.nftViewer.navigateToNftGallery();
    await expect(app.nftGallery.nftListComponent()).toBeVisible();
  });

  it('should show receive NFT\'s modal when "Adding new item" from list', async () => {
    await expect(app.nftGallery.nftReceiveModal()).not.toBeVisible();
    await tapByElement(app.nftGallery.nftAddNewListItem());
    await expect(app.nftGallery.nftReceiveModal()).toBeVisible();
  });

  it("should let you pick a crypto account to receive NFT", async () => {
    await expect(app.receive.step1HeaderTitle()).not.toBeVisible();
    await app.nftGallery.continueFromReceiveNFTsModal();
    await expect(app.receive.step1HeaderTitle()).toBeVisible();
    await expect(app.receive.step2HeaderTitle()).not.toExist();
    await tapByText("Ethereum");
    await expect(app.receive.step2HeaderTitle()).toBeVisible();
    await tapByText("Ethereum");
    await expect(app.receive.step2Accounts()).toBeVisible();
  });

  it("should let users hide NFT's", async () => {
    await app.nftGallery.openViaDeeplink();
    await app.nftGallery.hideNft(0);
  });

  it("should render empty state", async () => {
    await expect(app.nftGallery.emptyScreen()).toBeVisible(50);
  });

  it('should show filters on "reset" button tap', async () => {
    await expect(app.nftGallery.nftFilterDrawer()).not.toBeVisible();
    await tapByElement(app.nftGallery.emptyScreenResetButton());
    await expect(app.nftGallery.nftFilterDrawer()).toBeVisible();
  });
});
