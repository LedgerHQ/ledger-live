import { step } from "../../misc/reporters/step";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Drawer } from "../../component/drawer.component";

export class ModularAssetDrawer extends Drawer {
  private searchInputTestId = "modular-asset-drawer-search-input";
  private modularAssetSelectorContainer = this.page.getByTestId(
    "modular-asset-selection-container",
  );
  private searchInput = this.page.getByTestId(this.searchInputTestId);
  private drawerCloseButton = this.page.getByTestId("mad-close-button");
  private assetListContainer = this.page.getByTestId("asset-selector-list-container");
  private assetItemByTicker = (ticker: string) =>
    this.page.getByTestId(`asset-item-ticker-${ticker}`);
  private assetItemByName = (ticker: string) => this.page.getByTestId(`asset-item-name-${ticker}`);

  @step("Wait for drawer to be visible")
  async waitForDrawerToBeVisible() {
    await this.content.waitFor({ state: "visible" });
    await this.drawerOverlay.waitFor({ state: "attached" });
  }

  @step("Validate modular asset drawer is visible")
  async isModularDrawerVisible(): Promise<boolean> {
    await this.waitForDrawerToBeVisible();
    return await this.modularAssetSelectorContainer.isVisible();
  }

  @step("Validate asset drawer elements")
  async validateDrawerItems() {
    await this.modularAssetSelectorContainer.waitFor();
    await this.searchInput.waitFor();
    await this.drawerCloseButton.waitFor();
    await this.assetListContainer.waitFor();
  }

  @step("Select asset by ticker and name")
  async selectAssetByTickerAndName(currency: Currency) {
    await this.searchInput.waitFor();

    let ticker = this.assetItemByTicker(currency.ticker).first();

    if (!(await ticker.isVisible())) {
      await this.searchInput.first().fill(currency.ticker);

      await this.page.waitForFunction(
        ticker => {
          const elements = document.querySelectorAll(
            `[data-testid^="asset-item-ticker-${ticker}"]`,
          );
          return elements.length > 0;
        },
        currency.ticker,
        { timeout: 10000 },
      );

      ticker = this.assetItemByTicker(currency.ticker).first();
      if (!(await ticker.isVisible())) {
        throw new Error(`Asset with ticker ${currency.ticker} not found.`);
      }
    }

    if (await this.assetItemByName(currency.name).isVisible()) {
      await this.assetItemByName(currency.name).first().click();
      return;
    }
    await ticker.click();
  }
}
