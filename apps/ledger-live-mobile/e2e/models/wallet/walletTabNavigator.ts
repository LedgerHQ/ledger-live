import { getElementById, tapByElement } from "../../helpers";
import { ScreenName } from "../../../src/const";

export default class WalletTabNavigatorPage {
  nftGalleryTab = () =>
    getElementById(`wallet-tab-${ScreenName.WalletNftGallery}`);
  portfolioTab = () => getElementById(`wallet-tab-${ScreenName.Portfolio}`);

  async navigateToNftGallery() {
    await tapByElement(this.nftGalleryTab());
  }

  async navigateToPortfolio() {
    await tapByElement(this.portfolioTab());
  }
}
