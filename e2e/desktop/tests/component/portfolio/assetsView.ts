import { step } from "tests/misc/reporters/step";
import { Component } from "../../page/abstractClasses";
import { AssetCategory, AssetSection } from "./assetSection";
import { AssetTableRow } from "./assetTableRow";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

export class AssetsView extends Component {
  readonly section = (category: AssetCategory) => new AssetSection(this.page, category);
  private readonly root = this.page.getByTestId("assets-view");
  private readonly anyAssetRow = new AssetTableRow(this.root);
  private readonly categoryPageContent = this.page.getByTestId("crypto-assets-page-content");

  @step("Wait for asset sections to load")
  async waitForAssetsToLoad() {
    await Promise.all([
      this.section("cryptos").header.waitFor(),
      this.section("stablecoins").header.waitFor(),
    ]);
  }

  /**
   * Click the section header to open the dedicated category page.
   * Production only attaches `onClick` when the section has more than
   * `MAX_ITEM_DISPLAYED` items — calling this with fewer items will hang
   * waiting for the category page to render.
   */
  @step("Click 'show more' on $0 section header")
  async clickShowMore(category: AssetCategory) {
    await this.section(category).header.click();
    await this.categoryPageContent.waitFor();
  }

  @step("Expect $0 section header to be visible")
  async expectHeaderVisible(category: AssetCategory) {
    await this.section(category).expectHeaderVisible();
  }

  @step("Expect $0 section to have $1 rows")
  async expectNumberOfRowsInSection(category: AssetCategory, count: number) {
    await this.section(category).assetsTable.expectNumberOfRows(count);
  }

  @step("Click asset $1 in $0 section")
  async clickAssetInSection(category: AssetCategory, currency: Currency) {
    await this.section(category).assetsTable.assetTableRow.clickAsset(currency);
  }

  @step("Expect asset $1 visible in $0 section")
  async expectAssetVisibleInSection(category: AssetCategory, currency: Currency) {
    await this.section(category).assetsTable.assetTableRow.expectAssetVisible(currency);
  }

  @step("Expect assets visible in $0 section")
  async expectAssetsVisibleInSection(category: AssetCategory, currencies: Currency[]) {
    const section = this.section(category);
    for (const currency of currencies) {
      await section.assetsTable.assetTableRow.expectAssetVisible(currency);
    }
  }

  @step("Click asset $0")
  async clickAsset(currency: Currency) {
    await this.anyAssetRow.clickAsset(currency);
  }

  @step("Expect asset $0 value to be $1")
  async expectAssetValueToBe(currency: Currency, value: string) {
    await this.anyAssetRow.expectAssetValueToBe(currency, value);
  }
}
