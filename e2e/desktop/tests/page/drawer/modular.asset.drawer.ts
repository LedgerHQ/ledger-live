import { step } from "../../misc/reporters/step";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Drawer } from "../../component/drawer.component";

export class ModularAssetDrawer extends Drawer {
  private searchInputTestId = "modular-asset-drawer-search-input";
  private modularAssetSelectorContainer = this.page.getByTestId(
    "modular-drawer-screen-ASSET_SELECTION",
  );
  private searchInput = this.page.getByTestId(this.searchInputTestId);
  private drawerCloseButton = this.page.getByTestId("mad-close-button");
  private assetListContainer = this.page.getByTestId("asset-selector-list-container");
  private firstAssetRow = this.page.locator('[data-testid^="asset-item-name-"]').first();
  private assetItemTicker = (ticker: string) =>
    this.page.getByTestId(`asset-item-ticker-${ticker}`);
  private assetItemName = (ticker: string) => this.page.getByTestId(`asset-item-name-${ticker}`);
  private assetRow = (name: string, ticker: string) =>
    this.assetItemName(name)
      .locator("..")
      .filter({
        has: this.assetItemTicker(ticker),
      });

  @step("Wait for drawer to be visible")
  async waitForDrawerToBeVisible() {
    await this.content.waitFor({ state: "visible" });
    await this.drawerOverlay.waitFor({ state: "attached" });
  }

  @step("Validate modular asset drawer is visible")
  async isModularDrawerVisible(): Promise<boolean> {
    return await this.modularAssetSelectorContainer.isVisible();
  }

  @step("Validate asset drawer elements")
  async validateDrawerItems() {
    await this.waitForDrawerToBeVisible();
    await this.searchInput.waitFor();
    await this.drawerCloseButton.waitFor();
    await this.assetListContainer.waitFor();
  }

  @step("Select asset by ticker and name")
  async selectAssetByTickerAndName(currency: Currency) {
    await this.firstAssetRow.waitFor({ state: "visible" });
    await this.searchInput.waitFor();
    await this.firstAssetRow.waitFor({ state: "visible" });
    await this.searchInput.fill(currency.ticker);
    await this.firstAssetRow.waitFor({ state: "visible" });
    await this.assetRow(currency.name, currency.ticker).first().click();
  }

  @step("Select asset by ticker")
  async selectAssetByTicker(currency: Currency) {
    await this.searchInput.waitFor();
    await this.searchInput.fill(currency.ticker);
    await this.assetItemTicker(currency.ticker).first().click();
  }
}
