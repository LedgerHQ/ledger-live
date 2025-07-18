import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { AccountType } from "@ledgerhq/live-common/e2e/enum/Account";
import { Drawer } from "../../component/drawer.component";
import { ModularAssetDrawer } from "./modular.asset.drawer";
import { ModularNetworkDrawer } from "./modular.network.drawer";
import { ModularAccountDrawer } from "./modular.account.drawer";

export class ModularDrawer extends Drawer {
  private assetDrawer = new ModularAssetDrawer(this.page);
  private networkDrawer = new ModularNetworkDrawer(this.page);
  private accountDrawer = new ModularAccountDrawer(this.page);

  async isModularAssetsDrawerVisible(): Promise<boolean> {
    return await this.assetDrawer.isModularDrawerVisible();
  }

  async validateAssetsDrawerItems() {
    return await this.assetDrawer.validateDrawerItems();
  }

  async selectAssetByTicker(currency: Currency) {
    return await this.assetDrawer.selectAssetByTicker(currency);
  }

  async selectNetwork(currency?: Currency, networkIndex: number = 0) {
    return await this.networkDrawer.selectNetwork(currency, networkIndex);
  }

  async selectAccountByName(account: AccountType) {
    return await this.accountDrawer.selectAccountByName(account);
  }

  async clickOnAddAndExistingAccountButton() {
    return await this.accountDrawer.clickOnAddAndExistingAccountButton();
  }
}
