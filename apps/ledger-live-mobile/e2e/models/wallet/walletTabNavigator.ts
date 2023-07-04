import { getElementById, tapByElement } from "../../helpers";
import { ScreenName } from "../../../src/const";

export default class WalletTabNavigatorPage {
  nftGalleryTab = () => getElementById(`wallet-tab-${ScreenName.WalletNftGallery}`);
  portfolioTab = () => getElementById(`wallet-tab-${ScreenName.Portfolio}`);

  navigateToNftGallery() {
    return tapByElement(this.nftGalleryTab());
  }

  navigateToPortfolio() {
    return tapByElement(this.portfolioTab());
  }
}
