import { getElementById, tapByElement } from "../../helpers";
import { NavigatorName, ScreenName } from "../../../src/const";

export default class WalletTabNavigatorPage {
  nftGalleryTab = () => getElementById(`wallet-tab-${ScreenName.WalletNftGallery}`);
  portfolioTab = () => getElementById(`wallet-tab-${ScreenName.Portfolio}`);
  marketTab = () => getElementById(`wallet-tab-${NavigatorName.Market}`);

  async navigateToNftGallery() {
    await tapByElement(this.nftGalleryTab());
  }

  async navigateToPortfolio() {
    await tapByElement(this.portfolioTab());
  }

  async navigateToMarket() {
    await tapByElement(this.marketTab());
  }
}
