import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";
import { expect } from "@playwright/test";

export class ChooseAssetDrawer extends Drawer {
  private searchInput = this.page.getByTestId("select-asset-drawer-search-input").first();
  private currencyRow = (currencyName: string) =>
    this.page.getByTestId(`currency-row-${currencyName.toLowerCase()}`);

  @step("Choose asset to swap from: $0")
  async chooseFromAsset(currency: string) {
    await expect(this.searchInput.first()).toBeVisible();
    await this.searchInput.first().fill(currency);
    await this.currencyRow(currency).first().click();
  }

  @step("Verify choose asset drawer is visible")
  async verifyChooseAssetDrawer() {
    await expect(this.selectAssetTitle).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }
}
