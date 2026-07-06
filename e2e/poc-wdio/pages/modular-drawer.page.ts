import { getFlags } from "../bridge/server";
import {
  getByTestId,
  getByTestIdMatching,
} from "../components/appiumSelector.ts";
import { Feature_ModularDrawer } from "@ledgerhq/types-live";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { step } from "@wdio/allure-reporter";

export class ModularDrawerPage {
  private flags: Feature_ModularDrawer | null = null;
  // components
  get searchBar() {
    return getByTestId("modular-drawer-search-input");
  }

  get modularFlowView() {
    return getByTestId("modular-drawer-flow-view");
  }

  get accountItem() {
    return getByTestId("account-item");
  }

  // dynamic components
  public getAssetItemByTicker(ticker: string) {
    return getByTestIdMatching(new RegExp(`asset-item-${ticker}`, "i"));
  }

  public getNetworkItemIdMAD(networkId: string) {
    return getByTestIdMatching(new RegExp(`network-item-${networkId}`, "i"));
  }

  // steps
  async performSearchByTicker(ticker: string) {
    await step(
      `Perform search in modular drawer with ticker: ${ticker}`,
      async () => {
        await this.searchBar.setValue(ticker);

        // wait for search result to be displayed and stable
        await driver.waitUntil(async () => {
          let isDisplayed = false;
          for (let count = 0; count < 3; count++) {
            isDisplayed = await this.getAssetItemByTicker(ticker).isDisplayed();
            if (!isDisplayed) break;
            await driver.pause(500);
          }
          return isDisplayed;
        });
      },
    );
  }

  async selectCurrencyByTicker(ticker: string): Promise<void> {
    await step(
      `Select currency with ticker ${ticker} in modular drawer`,
      async () => {
        await this.getAssetItemByTicker(ticker).click();
      },
    );
  }

  async selectNetworkIfAsked(networkName: string): Promise<void> {
    await step(`Select network if asked: ${networkName}`, async () => {
      const isNetworkSelection = await this.getNetworkItemIdMAD(networkName)
        .waitForExist({
          timeout: 5_000,
        })
        .then(() => true)
        .catch(() => false);

      if (isNetworkSelection) {
        await this.selectNetwork(networkName);
      }
    });
  }

  async selectNetwork(networkName: string): Promise<void> {
    await step(`Select network in modular drawer: ${networkName}`, async () => {
      await this.getNetworkItemIdMAD(networkName).click();
    });
  }

  async selectFirstAccount() {
    await step("Select first account in modular drawer", async () => {
      // TODO: use $$ to get all and take first
      await this.accountItem.click();
    });
  }

  async verifyModularAssetDrawerVisible() {
    await step("Verify modular asset drawer is visible", async () => {
      await this.modularFlowView.waitForDisplayed();
      await expect(this.modularFlowView).toBeDisplayed();
      await expect(this.searchBar).toBeDisplayed();
    });
  }

  async selectAsset(account: Account): Promise<void> {
    await step(
      `Select currency in modular drawer: ${account.currency.ticker}`,
      async () => {
        await this.performSearchByTicker(account.currency.ticker);
        await this.selectCurrencyByTicker(account.currency.ticker);
        const networkName = this.getNetworkNameForAccount(account);
        await this.selectNetworkIfAsked(networkName);
        await this.selectFirstAccount();
        await this.modularFlowView.waitForExist({ reverse: true });
      },
    );
  }

  // functions
  private async loadFlags(): Promise<void> {
    this.flags ??= JSON.parse(await getFlags()).llmModularDrawer;
  }

  async isFlowEnabled<
    K extends keyof NonNullable<Feature_ModularDrawer["params"]>,
  >(flow: K): Promise<boolean> {
    await this.loadFlags();
    return this.flags!.enabled && Boolean(this.flags!.params?.[flow]);
  }

  getNetworkNameForAccount(account: Account): string {
    return account?.parentAccount === undefined
      ? account.currency.speculosApp.name
      : account?.parentAccount?.currency.name;
  }
}
