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
    await this.validateTopAssetsMarketCapOrder([Currency.BTC.ticker, Currency.ETH.ticker]);
  }

  @step("Get list of asset tickers in order")
  async getAssetTickersList(): Promise<string[]> {
    const tickerElements = this.page.locator('[data-testid^="asset-item-ticker-"]');
    const count = await tickerElements.count();

    const tickers: string[] = [];
    for (let i = 0; i < count; i++) {
      const ticker = await tickerElements.nth(i).textContent();
      if (ticker) {
        tickers.push(ticker.trim());
      }
    }

    return tickers;
  }

  @step("Validate top assets market cap order")
  async validateTopAssetsMarketCapOrder(expectedOrder: string[]) {
    const tickers = await this.getAssetTickersList();

    if (tickers.length === 0) {
      throw new Error("No assets found in asset list");
    }

    const actualTopAssets = tickers.slice(0, expectedOrder.length);

    for (let i = 0; i < expectedOrder.length; i++) {
      const expectedTicker = expectedOrder[i];
      const actualTicker = actualTopAssets[i];

      if (actualTicker !== expectedTicker) {
        throw new Error(
          `Market cap order validation failed at position ${i}: expected ${expectedTicker} but found ${actualTicker}. Expected order: ${expectedOrder.join(", ")}. Actual order: ${actualTopAssets.join(", ")}`,
        );
      }
    }
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
