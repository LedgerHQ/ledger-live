import { ScreenName, NavigatorName } from "../../../src/const";

export default class WalletTabNavigatorPage {
  portfolioTab = () => getElementById(`wallet-tab-${ScreenName.Portfolio}`);
  marketTab = () => getElementById(`wallet-tab-${NavigatorName.Market}`);

  async navigateToPortfolio() {
    await tapByElement(this.portfolioTab());
  }

  async navigateToMarket() {
    await tapByElement(this.marketTab());
  }
}
