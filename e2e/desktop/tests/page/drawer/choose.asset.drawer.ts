import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";
import { expect } from "@playwright/test";

export class ChooseAssetDrawer extends Drawer {
  private searchInputTestId = "select-asset-drawer-search-input";
  private searchInput = this.page.getByTestId(this.searchInputTestId);
  private currencyRow = (currencyName: string) =>
    this.page.getByTestId(`currency-row-${currencyName.toLowerCase()}`);

  @step("Choose asset to swap from: $0")
  async chooseFromAsset(currency: string) {
    await this.page.waitForFunction((tid: string) => {
      const searchInputs = document.querySelectorAll(`[data-testid='${tid}']`);
      return searchInputs.length === 1;
    }, this.searchInputTestId);
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(currency);
    await this.currencyRow(currency).first().click();
  }

  @step("Verify choose asset drawer is visible")
  async verifyChooseAssetDrawer() {
    await expect(this.selectAssetTitle).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }
}
