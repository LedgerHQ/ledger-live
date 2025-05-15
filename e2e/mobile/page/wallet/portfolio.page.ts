import { expect } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class PortfolioPage {
  baseLink = "portfolio";
  zeroBalance = "$0.00";
  graphCardBalanceId = "graphCard-balance";
  assetBalanceId = "asset-balance";
  readOnlyItemsId = "PortfolioReadOnlyItems";
  accountsListView = "PortfolioAccountsList";
  emptyPortfolioListId = "PortfolioEmptyList";
  portfolioSettingsButtonId = "settings-icon";
  addAccountCta = "add-account-cta";
  allocationSectionTitleId = "portfolio-allocation-section";

  portfolioSettingsButton = async () => await getElementById(this.portfolioSettingsButtonId);
  assetItemId = (currencyName: string) => `assetItem-${currencyName}`;

  @Step("Navigate to Settings")
  async navigateToSettings() {
    await tapByElement(await this.portfolioSettingsButton());
  }

  @Step("Wait for portfolio page to load")
  async waitForPortfolioPageToLoad() {
    await waitForElementById(this.portfolioSettingsButtonId, 120000);
  }

  @Step("Expect Portfolio read only")
  async expectPortfolioReadOnly() {
    await expect(await this.portfolioSettingsButton()).toBeVisible();
    await waitForElementById(this.readOnlyItemsId);
    jestExpect(await getTextOfElement(this.graphCardBalanceId)).toBe(this.zeroBalance);
    for (let index = 0; index < 4; index++)
      jestExpect(await getTextOfElement(this.assetBalanceId, index)).toBe(this.zeroBalance);
  }

  @Step("Open Portfolio via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Click on Add account button in portfolio")
  async addAccount() {
    await scrollToId(this.addAccountCta, this.emptyPortfolioListId);
    await tapById(this.addAccountCta);
  }

  @Step("Expect Portfolio with accounts")
  async expectPortfolioWithAccounts() {
    await expect(getElementById(this.accountsListView)).toBeVisible();
  }

  @Step("Go to asset's accounts from portfolio")
  async goToAccounts(currencyName: string) {
    await scrollToId(this.allocationSectionTitleId, this.accountsListView);
    await tapById(this.assetItemId(currencyName));
  }
}
