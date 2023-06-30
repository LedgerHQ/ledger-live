import { expect } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";

import WalletTabNavigatorPage from "../models/wallet/walletTabNavigator";
import NftViewerPage from "../models/nft/nftViewerPage";
import NftGalleryPage from "../models/wallet/nftGalleryPage";
import { tapByElement, tapByText } from "../helpers";
import ReceivePage from "../models/trade/receivePage";
import { loadConfig } from "../bridge/server";

let portfolioPage: PortfolioPage;
let walletTabNavigatorPage: WalletTabNavigatorPage;
let nftGalleryPage: NftGalleryPage;
let nftViewerPage: NftViewerPage;
let receivePage: ReceivePage;

describe("NFT Gallery screen", () => {
  beforeAll(async () => {
    loadConfig("1Account1NFTReadOnlyFalse");

    portfolioPage = new PortfolioPage();
    walletTabNavigatorPage = new WalletTabNavigatorPage();
    nftGalleryPage = new NftGalleryPage();
    nftViewerPage = new NftViewerPage();
    receivePage = new ReceivePage();

    await portfolioPage.waitForPortfolioPageToLoad();
    await nftGalleryPage.openViaDeeplink();
  });

  it("should see NFT tab", async () => {
    await expect(walletTabNavigatorPage.nftGalleryTab()).toBeVisible();
  });

  it("should navigate to portfolio page on tab press", async () => {
    await walletTabNavigatorPage.navigateToPortfolio();
    await expect(nftGalleryPage.root()).not.toBeVisible();
  });

  it("should navigate back to NFT gallery on tab press", async () => {
    await walletTabNavigatorPage.navigateToNftGallery();
    await expect(nftGalleryPage.root()).toBeVisible();
  });

  it("should have a list of NFTs", async () => {
    await expect(nftGalleryPage.nftListComponent()).toBeVisible();
    await expect(nftGalleryPage.nftListItem(0)).toBeVisible();
  });

  it("should navigate to NFT viewer page on NFT gallery item press", async () => {
    await tapByElement(nftGalleryPage.nftListItem(0));
    await expect(nftViewerPage.mainScrollView()).toBeVisible();
  });

  it("should navigate back to NFT gallery on back button press", async () => {
    await expect(nftGalleryPage.nftListComponent()).not.toBeVisible();
    await nftViewerPage.navigateToNftGallery();
    await expect(nftGalleryPage.nftListComponent()).toBeVisible();
  });

  it('should show receive NFT\'s modal when "Adding new item" from list', async () => {
    await expect(nftGalleryPage.nftReceiveModal()).not.toBeVisible();
    await tapByElement(nftGalleryPage.nftAddNewListItem());
    await expect(nftGalleryPage.nftReceiveModal()).toBeVisible();
  });

  it("should let you pick a crypto account to receive NFT", async () => {
    await expect(receivePage.getStep1HeaderTitle()).not.toBeVisible();
    await nftGalleryPage.continueFromReceiveNFTsModal();
    await expect(receivePage.getStep1HeaderTitle()).toBeVisible();
    await expect(receivePage.getStep3HeaderTitle()).not.toExist();
    await tapByText("Ethereum");
    // NOTE: Use .toExist because the modal overlay with an opacity
    // means we cannot use .toBeVisible
    await expect(receivePage.getStep3HeaderTitle()).toExist();
  });

  it("should let users hide NFT's", async () => {
    await nftGalleryPage.openViaDeeplink();
    await nftGalleryPage.hideNft(0);
  });

  it("should render empty state", async () => {
    await expect(nftGalleryPage.emptyScreen()).toBeVisible();
  });

  it('should show modal on "Receive NFT\'s" button tap', async () => {
    await expect(nftGalleryPage.nftReceiveModal()).not.toBeVisible();
    await tapByElement(nftGalleryPage.receiveNftButton());
    await expect(nftGalleryPage.nftReceiveModal()).toBeVisible();
  });
});
