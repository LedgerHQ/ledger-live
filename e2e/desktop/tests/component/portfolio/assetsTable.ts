import { expect, Locator } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AssetTableRow } from "./assetTableRow";

export class AssetsTable {
  readonly rows: Locator;
  readonly assetTableRow: AssetTableRow;
  constructor(parentLocator: Locator) {
    this.rows = parentLocator.locator("tbody tr");
    this.assetTableRow = new AssetTableRow(parentLocator);
  }

  @step("Expect number of rows in section to be $0")
  async expectNumberOfRows(numberOfRows: number) {
    await expect(this.rows).toHaveCount(numberOfRows);
  }
}
