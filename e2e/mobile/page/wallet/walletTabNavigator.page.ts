import { Step } from "jest-allure2-reporter/api";
import { ScreenName } from "../../../../apps/ledger-live-mobile/src/const/navigation";

export default class WalletTabNavigatorPage {
  portfolioTab = async () => getElementById(`wallet-tab-${ScreenName.Portfolio}`);

  @Step("Click on Portfolio tab")
  async navigateToPortfolio() {
    await tapByElement(await this.portfolioTab());
  }
}
