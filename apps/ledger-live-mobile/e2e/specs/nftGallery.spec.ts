import { expect } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import { loadConfig } from "../bridge/server";
import WalletTabNavigatorPage from "../models/wallet/walletTabNavigator";
import NftViewerPage from "../models/nft/nftViewerPage";
import NftGalleryPage from "../models/wallet/nftGalleryPage";
import ManagerPage from "../models/manager/managerPage";
import { tapByText } from "../helpers";
import ReceivePage from "../models/trade/receivePage";

let portfolioPage: PortfolioPage;
let walletTabNavigatorPage: WalletTabNavigatorPage;
let nftGalleryPage: NftGalleryPage;
let nftViewerPage: NftViewerPage;
let managerPage: ManagerPage;
let receivePage: ReceivePage;

beforeAll(async () => {
  portfolioPage = new PortfolioPage();
  walletTabNavigatorPage = new WalletTabNavigatorPage();
  nftGalleryPage = new NftGalleryPage();
  nftViewerPage = new NftViewerPage();
  managerPage = new ManagerPage();
  receivePage = new ReceivePage();
});

describe("NFT Gallery screen", () => {
  beforeAll(async () => {
    await loadConfig("1Account1NFT", true);
    await portfolioPage.waitForPortfolioPageToLoad();
    await managerPage.openViaDeeplink();
    await managerPage.expectManagerPage();
    await managerPage.addDevice("Nano X de David");
    await portfolioPage.openViaDeeplink();
  });

  it("should open on Portofolio page", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("should see NFT tab", async () => {
    await expect(walletTabNavigatorPage.nftGalleryTab()).toBeVisible();
  });

  it("should navigate to NFT gallery on NFT tab press", async () => {
    await walletTabNavigatorPage.navigateToNftGallery();
    await expect(nftGalleryPage.nftListComponent()).toBeVisible();
  });

  it("should navigate to NFT viewer page on NFT gallery item press", async () => {
    await nftGalleryPage.navigateToNftViewer();
    await expect(nftViewerPage.mainScrollView()).toBeVisible();
  });

  it("should navigate back to NFT gallery on back button press", async () => {
    await expect(nftGalleryPage.nftListComponent()).not.toBeVisible();
    await nftViewerPage.navigateToNftGallery();
    await expect(nftGalleryPage.nftListComponent()).toBeVisible();
  });

  it('should show receive NFT\'s modal when "Adding new item"', async () => {
    await expect(nftGalleryPage.nftReceiveModal()).not.toBeVisible();
    await nftGalleryPage.openRecevieNFTsModal();
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
});
