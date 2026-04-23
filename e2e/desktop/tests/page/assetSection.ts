import { expect, Locator, Page } from "@playwright/test";
import { Component } from "./abstractClasses";
import { step } from "tests/misc/reporters/step";

export type AssetCategory = "cryptos" | "stablecoins";

export class AssetSection extends Component {
  readonly section: Locator;
  readonly rows: Locator;
  readonly header: Locator;
  readonly rowByAssetName: (assetName: string) => Locator;
  constructor(page: Page, sectionId: AssetCategory) {
    super(page);
    this.section = this.page.getByTestId(`${sectionId}-section`);
    this.rows = this.section.locator("tbody tr");
    this.header = this.section.getByTestId(`${sectionId}-section-header-button`);
    this.rowByAssetName = (assetName: string) => this.section.getByText(assetName, { exact: true });
  }

  @step("Expect number of rows in section to be $0")
  async expectNumberOfRows(numberOfRows: number) {
    await expect(this.rows).toHaveCount(numberOfRows);
  }

  @step("Expect section header is visible")
  async expectHeaderVisible() {
    await expect(this.header).toBeVisible();
  }

  @step("Click asset in section")
  async clickAssetInSection(assetName: string) {
    await this.rowByAssetName(assetName).click();
  }

  @step("Expect asset to be visible in section")
  async expectAssetVisibleInSection(assetName: string) {
    await expect(this.rowByAssetName(assetName)).toBeVisible();
  }
}
