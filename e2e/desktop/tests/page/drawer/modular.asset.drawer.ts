import { step } from "../../misc/reporters/step";
import { Component } from "../abstractClasses";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

export class ModularAssetDrawer extends Component {
  private drawerContent = this.page.getByTestId("modular-asset-selection-container");
  private searchInput = this.page.getByTestId("modular-asset-drawer-search-input");
  private closeButton = this.page.getByTestId("mad-close-button");
  private assetListContainer = this.page.getByTestId("asset-selector-list-container");
  private assetItemByTicker = (ticker: string) =>
    this.page.getByTestId(`asset-item-ticker-${ticker}`);

  @step("Validate modular asset drawer is visible")
  async isModularDrawerVisible(): Promise<boolean> {
    return await this.drawerContent.isVisible();
  }

  @step("Validate asset drawer elements")
  async validateDrawer() {
    await this.drawerContent.waitFor();
    await this.searchInput.waitFor();
    await this.closeButton.waitFor();
    await this.assetListContainer.waitFor();
  }

  @step("Select asset by ticker $0")
  async selectAssetByTicker(currency: Currency) {
    const ticker = this.assetItemByTicker(currency.ticker).first();
    if (!(await ticker.isVisible())) {
      await this.searchInput.fill(currency.ticker);
      await ticker.isVisible();
    }
    await ticker.click();
  }
}
