import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";
import { Features } from "@shared/feature-flags";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { step } from "@wdio/allure-reporter";
import { byId, byIdMatching } from "@e2e-mobile/components/ElementHandle";

export class ModularDrawerPage {
  private flags: Features["llmModularDrawer"] | null = null;

  // components
  private readonly searchBar = byId("modular-drawer-search-input");
  private readonly modularFlowView = byId("modular-drawer-flow-view");
  private readonly accountItem = byId("account-item");

  // dynamic components
  public getAssetItemByTicker(ticker: string) {
    return byIdMatching(new RegExp(`asset-item-${ticker}`, "i"));
  }

  public getNetworkItemIdMAD(networkId: string) {
    return byIdMatching(new RegExp(`network-item-${networkId}`, "i"));
  }

  // steps
  async performSearchByTicker(ticker: string) {
    await step(`Perform search in modular drawer with ticker: ${ticker}`, async () => {
      await this.searchBar.replaceText(ticker);

      // wait for search result to be displayed and stable
      await driver.waitUntil(async () => {
        let isDisplayed = false;
        for (let count = 0; count < 3; count++) {
          isDisplayed = await this.getAssetItemByTicker(ticker).isVisible();
          if (!isDisplayed) break;
          await driver.pause(500);
        }
        return isDisplayed;
      });
    });
  }

  async selectCurrencyByTicker(ticker: string): Promise<void> {
    await step(`Select currency with ticker ${ticker} in modular drawer`, async () => {
      await this.getAssetItemByTicker(ticker).tap();
    });
  }

  async selectNetworkIfAsked(networkName: string): Promise<void> {
    await step(`Select network if asked: ${networkName}`, async () => {
      const isNetworkSelection = await this.getNetworkItemIdMAD(networkName)
        .waitExist(TIMEOUT.small)
        .then(() => true)
        .catch(() => false);

      if (isNetworkSelection) {
        await this.selectNetwork(networkName);
      }
    });
  }

  async selectNetwork(networkName: string): Promise<void> {
    await step(`Select network in modular drawer: ${networkName}`, async () => {
      await this.getNetworkItemIdMAD(networkName).tap();
    });
  }

  async selectFirstAccount() {
    await step("Select first account in modular drawer", async () => {
      // TODO: use $$ to get all and take first
      await this.accountItem.tap();
    });
  }

  async selectAsset(account: Account): Promise<void> {
    await step(`Select currency in modular drawer: ${account.currency.ticker}`, async () => {
      await this.performSearchByTicker(account.currency.ticker);
      await this.selectCurrencyByTicker(account.currency.ticker);
      const networkName = this.getNetworkNameForAccount(account);
      await this.selectNetworkIfAsked(networkName);
      await this.selectFirstAccount();
      await this.modularFlowView.waitNotExist();
    });
  }

  // functions
  getNetworkNameForAccount(account: Account): string {
    return account?.parentAccount === undefined
      ? account.currency.speculosApp.name
      : account?.parentAccount?.currency.name;
  }
}
