import { step } from "../../misc/reporters/step";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Drawer } from "../../component/drawer.component";

export class ModularAssetDrawer extends Drawer {
  private searchInputTestId = "modular-asset-drawer-search-input";
  private modularAssetSelectorContainer = this.page.getByTestId(
    "modular-asset-selection-container",
  );
  private searchInput = this.page.getByTestId(this.searchInputTestId);
  private closeButton = this.page.getByTestId("mad-close-button");
  private assetListContainer = this.page.getByTestId("asset-selector-list-container");
  private assetItemByTicker = (ticker: string) =>
    this.page.getByTestId(`asset-item-ticker-${ticker}`);

  @step("Validate modular asset drawer is visible")
  async isModularDrawerVisible(): Promise<boolean> {
    return await this.modularAssetSelectorContainer.isVisible();
  }

  @step("Validate asset drawer elements")
  async validateDrawerItems() {
    await this.modularAssetSelectorContainer.waitFor();
    await this.searchInput.waitFor();
    await this.closeButton.waitFor();
    await this.assetListContainer.waitFor();
  }

  @step("Select asset by ticker")
  async selectAssetByTicker(currency: Currency) {
    await this.page.waitForSelector(`[data-testid="${this.searchInputTestId}"]`, {
      state: "visible",
    });

    const ticker = this.assetItemByTicker(currency.ticker).first();
    if (!(await ticker.isVisible())) {
      await this.searchInput.first().fill(currency.ticker);
      await ticker.isVisible();
    }
    await ticker.click();
  }
}
