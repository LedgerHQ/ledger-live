import { step } from "../../misc/reporters/step";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { getTopAssetsByMarketCap } from "@ledgerhq/live-common/e2e/getAssetsByMarketCap";
import { Drawer } from "../../component/drawer.component";

export class ModularAssetDrawer extends Drawer {
  private readonly searchInputTestId = "modular-asset-drawer-search-input";
  private readonly assetNameTestIdPrefix = "asset-item-name-";

  private readonly modularAssetSelectorContainer = this.page
    .getByTestId("modular-asset-selection-container")
    .first();
  private readonly searchInput = this.page.getByTestId(this.searchInputTestId).first();
  private readonly drawerCloseButton = this.page.getByTestId("mad-close-button");
  private readonly assetListContainer = this.page
    .getByTestId("asset-selector-list-container")
    .first();

  private get assetNameElements() {
    return this.page.locator(`[data-testid^="${this.assetNameTestIdPrefix}"]`);
  }

  private assetItemByName = (name: string) =>
    this.page.getByTestId(`${this.assetNameTestIdPrefix}${name}`);

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

  @step("Fetch assets based on market cap order from backend")
  private async fetchAssetsBasedOnMarketCapOrder(): Promise<string[]> {
    try {
      return await getTopAssetsByMarketCap();
    } catch (error) {
      console.error("Error fetching asset data:", error);
      return [Currency.BTC.name, Currency.ETH.name];
    }
  }

  @step("Get list of asset names in order")
  async getAssetNamesList(): Promise<string[]> {
    const nameElements = this.assetNameElements;
    const count = await nameElements.count();

    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const name = await nameElements.nth(i).textContent();
      if (name) {
        names.push(name.trim());
      }
    }

    return names;
  }

  @step("Validate top assets market cap order")
  async validateTopAssetsByMarketCapOrder() {
    const expectedOrder = await this.fetchAssetsBasedOnMarketCapOrder();
    const names = await this.getAssetNamesList();

    if (names.length === 0) {
      throw new Error("No assets found in asset list");
    }

    const compareLength = Math.min(expectedOrder.length, names.length);
    const actualTopAssets = names.slice(0, compareLength);

    for (let i = 0; i < compareLength; i++) {
      const expectedName = expectedOrder[i];
      const actualName = actualTopAssets[i];

      if (actualName !== expectedName) {
        throw new Error(
          `Asset order validation failed at position ${i}: expected ${expectedName} but found ${actualName}. Expected order: ${expectedOrder.slice(0, compareLength).join(", ")}. Actual order: ${actualTopAssets.join(", ")}`,
        );
      }
    }
  }

  @step("Select asset by name")
  async selectAssetByName(currency: Currency) {
    await this.searchInput.waitFor();

    await this.validateTopAssetsByMarketCapOrder();

    const nameElement = await this.ensureNameVisible(currency);
    await nameElement.click();
  }

  private async ensureNameVisible(currency: Currency) {
    let nameElement = this.assetItemByName(currency.name).first();

    if (!(await nameElement.isVisible())) {
      await this.searchInput.first().fill(currency.name);
      await this.waitForNameToAppear(currency.name);
      nameElement = this.assetItemByName(currency.name).first();

      if (!(await nameElement.isVisible())) {
        throw new Error(`Asset with name ${currency.name} not found.`);
      }
    }

    return nameElement;
  }

  private async waitForNameToAppear(name: string) {
    await this.page.waitForFunction(
      ({ name, prefix }) => {
        const elements = document.querySelectorAll(`[data-testid^="${prefix}${name}"]`);
        return elements.length > 0;
      },
      { name, prefix: this.assetNameTestIdPrefix },
      { timeout: 10000 },
    );
  }
}
