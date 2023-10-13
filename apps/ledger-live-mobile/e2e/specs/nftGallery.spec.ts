import { expect } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import WalletTabNavigatorPage from "../models/wallet/walletTabNavigator";
import NftViewerPage from "../models/nft/nftViewerPage";
import NftGalleryPage from "../models/wallet/nftGalleryPage";
import { tapByElement, tapByText } from "../helpers";
import DepositPage from "../models/trade/depositPage";
import { loadConfig } from "../bridge/server";

let portfolioPage: PortfolioPage;
let walletTabNavigatorPage: WalletTabNavigatorPage;
let nftGalleryPage: NftGalleryPage;
let nftViewerPage: NftViewerPage;
let depositPage: DepositPage;

describe("NFT Gallery screen", () => {
  beforeAll(async () => {
    loadConfig("1Account1NFTReadOnlyFalse");

    portfolioPage = new PortfolioPage();
    walletTabNavigatorPage = new WalletTabNavigatorPage();
    nftGalleryPage = new NftGalleryPage();
    nftViewerPage = new NftViewerPage();
    depositPage = new DepositPage();

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
    await expect(depositPage.step1HeaderTitle()).not.toBeVisible();
    await nftGalleryPage.continueFromReceiveNFTsModal();
    await expect(depositPage.step1HeaderTitle()).toBeVisible();
    await expect(depositPage.step2HeaderTitle()).not.toExist();
    await tapByText("Ethereum");
    await expect(depositPage.step2HeaderTitle()).toBeVisible();
    await tapByText("Ethereum");
    await expect(depositPage.step2Accounts()).toBeVisible();
  });

  it("should let users hide NFT's", async () => {
    await nftGalleryPage.openViaDeeplink();
    await nftGalleryPage.hideNft(0);
  });

  it("should render empty state", async () => {
    await expect(nftGalleryPage.emptyScreen()).toBeVisible(50);
  });

  it('should show filters on "reset" button tap', async () => {
    await expect(nftGalleryPage.nftFilterDrawer()).not.toBeVisible();
    await tapByElement(nftGalleryPage.emptyScreenResetButton());
    await expect(nftGalleryPage.nftFilterDrawer()).toBeVisible();
  });
});
