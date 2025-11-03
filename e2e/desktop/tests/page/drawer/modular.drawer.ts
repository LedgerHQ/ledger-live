import { Page } from "@playwright/test";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { AccountType } from "@ledgerhq/live-common/e2e/enum/Account";
import { Drawer } from "../../component/drawer.component";
import { ModularAssetDrawer } from "./modular.asset.drawer";
import { ModularNetworkDrawer } from "./modular.network.drawer";
import { ModularAccountDrawer } from "./modular.account.drawer";
import { ModularScanAccountsDrawer } from "./modular.scan.accounts.drawer";

export class ModularDrawer extends Drawer {
  protected assetDrawer: ModularAssetDrawer;
  protected networkDrawer: ModularNetworkDrawer;
  protected accountDrawer: ModularAccountDrawer;
  protected scanAccountsDrawer: ModularScanAccountsDrawer;

  constructor(page: Page) {
    super(page);
    this.assetDrawer = new ModularAssetDrawer(page);
    this.networkDrawer = new ModularNetworkDrawer(page);
    this.accountDrawer = new ModularAccountDrawer(page);
    this.scanAccountsDrawer = new ModularScanAccountsDrawer(page);
  }

  async isModularAssetsDrawerVisible(): Promise<boolean> {
    return await this.assetDrawer.isModularDrawerVisible();
  }

  async validateAssetsDrawerItems() {
    return await this.assetDrawer.validateDrawerItems();
  }

  async selectAssetByTickerAndName(currency: Currency) {
    return await this.assetDrawer.selectAssetByTickerAndName(currency);
  }

  async selectAssetByTicker(currency: Currency) {
    return await this.assetDrawer.selectAssetByTicker(currency);
  }

  async selectNetwork(currency: Currency, networkIndex: number = 0) {
    if (await this.isNetworkDrawerVisible()) {
      return await this.networkDrawer.selectNetwork(currency, networkIndex);
    }
  }

  async isNetworkDrawerVisible(): Promise<boolean> {
    return await this.networkDrawer.isNetworkDrawerVisible();
  }

  async isModularAccountDrawerVisible(): Promise<boolean> {
    return await this.accountDrawer.isModularAccountDrawerVisible();
  }

  async isModularScanAccountsDrawerVisible(): Promise<boolean> {
    return await this.scanAccountsDrawer.isModularScanAccountsDrawerVisible();
  }

  async selectAccountByName(account: AccountType) {
    return await this.accountDrawer.selectAccountByName(account);
  }

  async clickOnAddAndExistingAccountButton() {
    return await this.accountDrawer.clickOnAddAndExistingAccountButton();
  }
}
