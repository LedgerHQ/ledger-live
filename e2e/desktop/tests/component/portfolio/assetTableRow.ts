import { expect, Locator } from "@playwright/test";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { sanitizeAssetNameForTestId } from "~/mvvm/features/Assets/utils/assetTableHelpers";
import { step } from "tests/misc/reporters/step";

export class AssetTableRow {
  constructor(private readonly parentLocator: Locator) {}

  assetByCurrency(currency: Currency): Locator {
    const assetName = `${currency.name}-${currency.id}`;
    const sanitizedName = sanitizeAssetNameForTestId(assetName);
    return this.parentLocator.getByTestId(`w40-asset-row-${sanitizedName}`);
  }

  assetValueByCurrency(currency: Currency): Locator {
    const assetName = `${currency.name}-${currency.id}`;
    const sanitizedName = sanitizeAssetNameForTestId(assetName);
    return this.parentLocator.getByTestId(`w40-asset-row-value-${sanitizedName}`);
  }

  @step("Click asset $0")
  async clickAsset(currency: Currency) {
    await this.assetByCurrency(currency).click();
  }

  @step("Expect asset $0 to be visible")
  async expectAssetVisible(currency: Currency) {
    await expect(this.assetByCurrency(currency)).toBeVisible();
  }

  @step("Expect asset $0 value to be $1")
  async expectAssetValueToBe(currency: Currency, value: string) {
    await expect(this.assetValueByCurrency(currency)).toContainText(value);
  }
}
