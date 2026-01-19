import { Step } from "jest-allure2-reporter/api";
import { ScreenName, NavigatorName } from "../../../src/const";

export default class WalletTabNavigatorPage {
  portfolioTab = () => getElementById(`wallet-tab-${ScreenName.Portfolio}`);
  marketTab = () => getElementById(`wallet-tab-${NavigatorName.Market}`);

  @Step("Click on Portfolio tab")
  async navigateToPortfolio() {
    await tapByElement(this.portfolioTab());
  }

  @Step("Click on Market tab")
  async navigateToMarket() {
    await tapByElement(this.marketTab());
  }
}
