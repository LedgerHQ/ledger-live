import { ScreenName, NavigatorName } from "~/const";

export default class WalletTabNavigatorPage {
  nftGalleryTab = async () => await getElementById(`wallet-tab-${ScreenName.WalletNftGallery}`);
  portfolioTab = async () => await getElementById(`wallet-tab-${ScreenName.Portfolio}`);
  marketTab = async () => await getElementById(`wallet-tab-${NavigatorName.Market}`);

  @Step("Click on NFT Gallery tab")
  async navigateToNftGallery() {
    await tapByElement(await this.nftGalleryTab());
  }

  @Step("Click on Portfolio tab")
  async navigateToPortfolio() {
    await tapByElement(await this.portfolioTab());
  }

  @Step("Click on Market tab")
  async navigateToMarket() {
    await tapByElement(await this.marketTab());
  }
}
