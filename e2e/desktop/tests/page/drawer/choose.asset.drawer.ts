import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { expect } from "@playwright/test";

export class ChooseAssetDrawer extends Drawer {
  private searchInputTestId = "select-asset-drawer-search-input";

  private get searchInput() {
    return this.page.getByTestId(this.searchInputTestId).first();
  }

  private async findAssetRow(assetName: string, networkName?: string) {
    const assetRows = this.page.locator(`[data-testid^="currency-row-"]`);
    const assetCount = await assetRows.count();

    if (assetCount === 0) throw new Error(`No asset found for "${assetName}"`);

    if (!networkName) return assetRows.first();

    for (let i = 0; i < assetCount; i++) {
      const row = assetRows.nth(i);
      const text = (await row.textContent())?.toLowerCase() ?? "";

      if (!text.includes(assetName.toLowerCase())) continue;

      const badges = row.locator("span:visible");
      const badgeTexts = await badges.allTextContents();
      if (badgeTexts.some(b => b.trim().toLowerCase() === networkName.toLowerCase())) {
        return row;
      }
    }

    throw new Error(`Asset "${assetName}" with network "${networkName}" not found`);
  }

  @step("Choose asset: $0")
  async chooseFromAsset(assetName: string, networkName?: string) {
    await this.searchInput.waitFor({ state: "visible" });
    await this.searchInput.fill(assetName);

    const row = await this.findAssetRow(assetName, networkName);
    await row.click();
  }

  @step("Verify choose asset drawer is visible")
  async verifyChooseAssetDrawer() {
    await expect(this.selectAssetTitle).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }
}
