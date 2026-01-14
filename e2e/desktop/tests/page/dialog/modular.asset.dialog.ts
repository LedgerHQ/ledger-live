import { step } from "../../misc/reporters/step";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Dialog } from "../../component/dialog.component";
import { expect } from "@playwright/test";

export class ModularAssetDialog extends Dialog {
  private searchInputTestId = "modular-asset-dialog-search-input";
  private modularAssetSelectorContainer = this.page.getByTestId(
    "modular-dialog-screen-ASSET_SELECTION",
  );
  private searchInput = this.page.getByTestId(this.searchInputTestId);
  private assetListContainer = this.page.getByTestId("asset-selector-list-container");
  private assetItemRow = (ticker: string) =>
    this.page.getByTestId(`asset-item-ticker-${ticker.toLowerCase()}`);

  @step("Wait for dialog to be visible")
  async waitForDialogToBeVisible() {
    await expect(this.content).toBeVisible();
    await this.dialogOverlay.waitFor({ state: "attached" });
  }

  @step("Validate modular asset dialog is visible")
  async isModularAssetDialogVisible(): Promise<boolean> {
    return await this.modularAssetSelectorContainer.isVisible();
  }

  @step("Validate asset dialog elements")
  async validateAssetDialogItems() {
    await this.waitForDialogToBeVisible();
    await expect(this.modularAssetSelectorContainer).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.closeButton).toBeVisible();
    await expect(this.assetListContainer).toBeVisible();
  }

  @step("Select asset by ticker")
  async selectAssetByTicker(currency: Currency) {
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(currency.ticker);
    await this.assetItemRow(currency.ticker).first().click();
  }
}
