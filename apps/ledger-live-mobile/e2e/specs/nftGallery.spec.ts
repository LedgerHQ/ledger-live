import { expect } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import { loadConfig } from "../bridge/server";
import WalletTabNavigatorPage from "../models/wallet/walletTabNavigator";
import NftViewerPage from "../models/nft/nftViewerPage";
import NftGalleryPage from "../models/wallet/nftGalleryPage";

let portfolioPage: PortfolioPage;
let walletTabNavigatorPage: WalletTabNavigatorPage;
let nftGalleryPage: NftGalleryPage;
let nftViewerPage: NftViewerPage;

describe("NFT Gallery screen", () => {
  beforeAll(async () => {
    await loadConfig("2_accounts_eth_with_tokens_and_nft", true);
    portfolioPage = new PortfolioPage();
    walletTabNavigatorPage = new WalletTabNavigatorPage();
    nftGalleryPage = new NftGalleryPage();
    nftViewerPage = new NftViewerPage();
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
});
