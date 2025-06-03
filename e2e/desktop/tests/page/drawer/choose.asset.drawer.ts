import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";
import { expect } from "@playwright/test";

export class ChooseAssetDrawer extends Drawer {
  private searchInput = this.page.getByTestId("select-asset-drawer-search-input");
  private currencyRow = (currencyName: string) =>
    this.page.getByTestId(`currency-row-${currencyName.toLowerCase()}`);

  @step("Choose asset to swap from: $0")
  async chooseFromAsset(currency: string) {
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(currency);
    await this.currencyRow(currency).first().click();
  }
}
