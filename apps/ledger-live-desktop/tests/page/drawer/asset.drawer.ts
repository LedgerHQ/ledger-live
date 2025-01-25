import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export class AssetDrawer extends Drawer {
  private assetInput = this.page.getByTestId("select-asset-drawer-search-input");
  private currencyRow = (currencyName: string) =>
    this.page.getByTestId(`currency-row-${currencyName}`);
  private accountRow = (accountName: string, accountIndex?: number) =>
    this.page.getByTestId(`account-row-${accountName}-${accountIndex}`);

  @step("Select asset")
  async selectAsset(asset: Currency) {
    await this.assetInput.click();
    await this.assetInput.fill(asset.name);
    await this.currencyRow(asset.name.toLowerCase()).click();
  }

  @step("Select account")
  async selectAccountByIndex(account: Account) {
    await this.accountRow(account.currency.name.toLowerCase(), account.index).click();
  }
}
