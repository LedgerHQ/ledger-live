import { expect, Locator } from "@playwright/test";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { sanitizeAssetNameForTestId } from "~/mvvm/features/Assets/utils/assetTableHelpers";
import { step } from "tests/misc/reporters/step";

export class AssetsTable {
  readonly root: Locator;
  readonly rows: Locator;

  constructor(parentLocator: Locator) {
    this.root = parentLocator;
    this.rows = parentLocator.locator("tbody tr");
  }

  private getCurrencyTestIdSuffix(currency: Currency): string {
    return sanitizeAssetNameForTestId(`${currency.name}-${currency.id}`);
  }

  assetByCurrency(currency: Currency): Locator {
    return this.root.getByTestId(`w40-asset-row-${this.getCurrencyTestIdSuffix(currency)}`);
  }

  assetValueByCurrency(currency: Currency): Locator {
    return this.root.getByTestId(`w40-asset-row-value-${this.getCurrencyTestIdSuffix(currency)}`);
  }

  // Wallet 4.0 Q2 `aggregatedAssets` renders one synthetic row per asset across networks; those
  // rows have no single Currency-enum id, so they are matched by their displayed name instead.
  private rowsByName(assetName: string): Locator {
    return this.rows.filter({ hasText: assetName });
  }

  @step("Click aggregated asset $0")
  async clickAssetByName(assetName: string) {
    await this.rowsByName(assetName).first().click();
  }

  @step("Expect a single aggregated row for $0")
  async expectSingleRowByName(assetName: string) {
    await expect(this.rowsByName(assetName)).toHaveCount(1);
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

  @step("Expect number of rows to be $0")
  async expectNumberOfRows(numberOfRows: number) {
    await expect(this.rows).toHaveCount(numberOfRows);
  }
}
