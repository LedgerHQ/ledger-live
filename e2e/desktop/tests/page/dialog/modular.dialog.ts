import { Page } from "@playwright/test";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { AccountType } from "@ledgerhq/live-common/e2e/enum/Account";
import { Dialog } from "../../component/dialog.component";
import { ModularAssetDialog } from "./modular.asset.dialog";
import { ModularNetworkDialog } from "./modular.network.dialog";
import { ModularAccountDialog } from "./modular.account.dialog";
import { ModularScanAccountsDrawer } from "../drawer/modular.scan.accounts.drawer";

export class ModularDialog extends Dialog {
  protected assetDialog: ModularAssetDialog;
  protected networkDialog: ModularNetworkDialog;
  protected accountDialog: ModularAccountDialog;
  protected scanAccountsDrawer: ModularScanAccountsDrawer;

  constructor(page: Page) {
    super(page);
    this.assetDialog = new ModularAssetDialog(page);
    this.networkDialog = new ModularNetworkDialog(page);
    this.accountDialog = new ModularAccountDialog(page);
    this.scanAccountsDrawer = new ModularScanAccountsDrawer(page);
  }

  // Asset selector
  async isVisible(): Promise<boolean> {
    return await this.isModularAssetsDialogVisible();
  }

  async validateItems() {
    return await this.validateAssetsDialogItems();
  }

  async selectAsset(currency: Currency) {
    return await this.selectAssetByTicker(currency);
  }

  // Account selector
  async isAccountVisible(): Promise<boolean> {
    return await this.isModularAccountDialogVisible();
  }
  async selectAccount(account: AccountType) {
    return await this.selectAccountByName(account);
  }

  async clickOnAddAndExistingAccount() {
    return await this.clickOnAddAndExistingAccountButton();
  }

  // ===== Original methods (kept for backward compatibility) =====
  async isModularAssetsDialogVisible(): Promise<boolean> {
    return await this.assetDialog.isModularAssetDialogVisible();
  }

  async validateAssetsDialogItems() {
    return await this.assetDialog.validateAssetDialogItems();
  }

  async selectAssetByTicker(currency: Currency) {
    return await this.assetDialog.selectAssetByTicker(currency);
  }

  async selectNetwork(currency: Currency, networkIndex: number = 0) {
    if (await this.isNetworkDialogVisible()) {
      return await this.networkDialog.selectNetwork(currency, networkIndex);
    }
  }

  async isNetworkDialogVisible(): Promise<boolean> {
    return await this.networkDialog.isNetworkDialogVisible();
  }

  async isModularAccountDialogVisible(): Promise<boolean> {
    return await this.accountDialog.isModularAccountDialogVisible();
  }

  async isModularScanAccountsDrawerVisible(): Promise<boolean> {
    return await this.scanAccountsDrawer.isModularScanAccountsDrawerVisible();
  }

  async selectAccountByName(account: AccountType) {
    return await this.accountDialog.selectAccountByName(account);
  }

  async clickOnAddAndExistingAccountButton() {
    return await this.accountDialog.clickOnAddAndExistingAccountButton();
  }
}
