import { ScreenName, NavigatorName } from "../../../src/const";

export default class WalletTabNavigatorPage {
  nftGalleryTab = () => getElementById(`wallet-tab-${ScreenName.WalletNftGallery}`);
  portfolioTab = () => getElementById(`wallet-tab-${ScreenName.Portfolio}`);
  marketTab = () => getElementById(`wallet-tab-${NavigatorName.Market}`);

  @Step("Click on NFT Gallery tab")
  async navigateToNftGallery() {
    await tapByElement(this.nftGalleryTab());
  }

  @Step("Click on Portfolio tab")
  async navigateToPortfolio() {
    await tapByElement(this.portfolioTab());
  }

  @Step("Click on Market tab")
  async navigateToMarket() {
    await tapByElement(this.marketTab());
  }
}
