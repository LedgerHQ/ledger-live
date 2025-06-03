import { step } from "../misc/reporters/step";
import { WebViewAppPage } from "./webViewApp.page";
import { AccountType, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";

export type TabName = "Buy" | "Sell";

export class BuyAndSellPage extends WebViewAppPage {
  private navigationTabs = "navigation-tabs";
  private cryptoCurrencySelectorLabel = "account-details";
  private cryptoCurrencySelector = "crypto-amount-option-button";
  private fiatOptionSelector = "fiat-amount-option-button";
  private tab = (name: TabName) => `${name.toLowerCase()}-tab`;

  @step("Expect Buy / Sell screen to be visible")
  async verifyBuySellScreen() {
    await this.verifyElementIsVisible(this.navigationTabs);
  }

  @step("Expect $0 tab to be selected")
  async verifySelectedTab(tabName: TabName) {
    await this.verifyElementIsSelected(this.tab(tabName));
  }

  @step("Expect asset selected to be displayed")
  async verifySelectedAssetIsDisplayed(account: AccountType) {
    await this.verifyElementText(this.cryptoCurrencySelector, account.currency.ticker);
    await this.verifyElementText(this.cryptoCurrencySelectorLabel, getParentAccountName(account));
  }

  @step("Assert Buy/Sell landing")
  async verifyBuySellLandingAndCryptoAssetSelector(account: AccountType, selectedTab: TabName) {
    await this.verifyBuySellScreen();
    await this.verifySelectedTab(selectedTab);
    await this.verifySelectedAssetIsDisplayed(account);
  }

  @step("Verify fiat asset selector $0")
  async verifyFiatAssetSelector(fait: string) {
    await this.verifyElementText(this.fiatOptionSelector, fait);
  }
}
