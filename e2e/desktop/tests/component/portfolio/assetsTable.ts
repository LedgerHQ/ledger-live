import { expect, Locator } from "@playwright/test";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { sanitizeAssetNameForTestId } from "~/mvvm/features/Assets/utils/assetTableHelpers";
import { step } from "tests/misc/reporters/step";

export class AssetsTable {
  readonly root: Locator;
  readonly rows: Locator;

  constructor(parentLocator: Locator) {
    this.root = parentLocator;
    this.rows = parentLocator.locator("tbody tr");
  }

  private currencyTestIdSuffix(currency: Currency): string {
    return sanitizeAssetNameForTestId(`${currency.name}-${currency.id}`);
  }

  assetByCurrency(currency: Currency): Locator {
    return this.root.getByTestId(`w40-asset-row-${this.currencyTestIdSuffix(currency)}`);
  }

  assetValueByCurrency(currency: Currency): Locator {
    return this.root.getByTestId(`w40-asset-row-value-${this.currencyTestIdSuffix(currency)}`);
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
