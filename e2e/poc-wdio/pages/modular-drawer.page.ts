import { getFlags } from "../bridge/server";
import { getByTestId, getByTestIdMatching } from "../components/appiumSelector.ts";
import { Feature_ModularDrawer } from "@ledgerhq/types-live";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

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
    await this.searchBar.setValue(ticker);
  }

  async selectCurrencyByTicker(ticker: string): Promise<void> {
    await this.getAssetItemByTicker(ticker).click();
  }

  async selectNetworkIfAsked(networkName: string): Promise<void> {
    if (await this.modularFlowView.isExisting()) {
      await this.selectNetwork(networkName);
    }
  }

  async selectNetwork(networkName: string): Promise<void> {
    await this.getNetworkItemIdMAD(networkName).click();
  }

  async selectFirstAccount() {
    // TODO: use $$ to get all and take first
    await this.accountItem.click();
  }

  async selectAsset(account: Account): Promise<void> {
    await this.performSearchByTicker(account.currency.ticker);
    await this.selectCurrencyByTicker(account.currency.ticker);
    const networkName = this.getNetworkNameForAccount(account);
    await this.selectNetworkIfAsked(networkName);
    await this.selectFirstAccount();
    await this.modularFlowView.waitForExist({ reverse: true });
  }

  // functions
  private async loadFlags(): Promise<void> {
    this.flags ??= JSON.parse(await getFlags()).llmModularDrawer;
  }

  async isFlowEnabled<K extends keyof NonNullable<Feature_ModularDrawer["params"]>>(
    flow: K,
  ): Promise<boolean> {
    await this.loadFlags();
    return this.flags!.enabled && Boolean(this.flags!.params?.[flow]);
  }

  getNetworkNameForAccount(account: Account): string {
    return account?.parentAccount === undefined
      ? account.currency.speculosApp.name
      : account?.parentAccount?.currency.name;
  }
}
