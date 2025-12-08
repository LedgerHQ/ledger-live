import {
  ScreenName,
  NavigatorName,
} from "../../../../apps/ledger-live-mobile/src/const/navigation";

export default class WalletTabNavigatorPage {
  portfolioTab = async () => getElementById(`wallet-tab-${ScreenName.Portfolio}`);
  marketTab = async () => getElementById(`wallet-tab-${NavigatorName.Market}`);

  @Step("Click on Portfolio tab")
  async navigateToPortfolio() {
    await tapByElement(await this.portfolioTab());
  }

  @Step("Click on Market tab")
  async navigateToMarket() {
    await tapByElement(await this.marketTab());
  }
}
