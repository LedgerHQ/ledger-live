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
  private assetItemTicker = (ticker: string) =>
    this.page.getByTestId(`asset-item-ticker-${ticker}`);
  private assetItemName = (ticker: string) => this.page.getByTestId(`asset-item-name-${ticker}`);

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
    await this.searchInput.waitFor();

    const tickerElement = await this.ensureTickerVisible(currency);

    const nameElement = this.assetItemName(currency.name);
    if (await nameElement.isVisible()) {
      await nameElement.first().click();
      return;
    }

    await tickerElement.click();
  }

  async ensureTickerVisible(currency: Currency) {
    let tickerElement = this.assetItemTicker(currency.ticker).first();
    if (!(await tickerElement.isVisible())) {
      await this.searchInput.first().fill(currency.ticker);
      await this.waitForTickerToAppear(currency.ticker);
      tickerElement = this.assetItemTicker(currency.ticker).first();
      if (!(await tickerElement.isVisible())) {
        throw new Error(`Asset with ticker ${currency.ticker} not found.`);
      }
    }
    return tickerElement;
  }

  async waitForTickerToAppear(ticker: string) {
    await this.page.waitForFunction(
      ticker => {
        const elements = document.querySelectorAll(`[data-testid^="asset-item-ticker-${ticker}"]`);
        return elements.length > 0;
      },
      ticker,
      { timeout: 10000 },
    );
  }
}
