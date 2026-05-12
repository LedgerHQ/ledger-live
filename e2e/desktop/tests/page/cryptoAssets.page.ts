import { expect, Locator, Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { AssetCategory } from "../component/portfolio/assetSection";
import { PageHeader } from "tests/component/pageHeader.component";
import { AssetsTable } from "../component/portfolio/assetsTable";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

export class CryptoAssetsPage extends AppPage {
  readonly category: AssetCategory;
  readonly header = new PageHeader(this.page);
  readonly content: Locator;
  readonly assetsTable: AssetsTable;
  constructor(page: Page, category: AssetCategory) {
    super(page);
    this.category = category;
    this.content = this.page.getByTestId("crypto-assets-page-content");
    this.assetsTable = new AssetsTable(this.content);
  }

  @step("Expect assets page content to be visible")
  async expectAssetsPage() {
    const headerText = this.category === "cryptos" ? "Crypto" : "Stablecoins";
    await expect(this.page).toHaveURL(new RegExp(String.raw`/assets\?category=${this.category}`));
    await expect(this.header.root).toHaveText(headerText, { ignoreCase: true });
    await expect(this.content).toBeVisible();
  }

  @step("Click back button in crypto assets page header")
  async clickBack() {
    await this.header.clickBack();
  }

  @step("Expect assets visible on assets page")
  async expectAssetsVisible(currencies: Currency[]) {
    for (const currency of currencies) {
      await this.assetsTable.assetTableRow.expectAssetVisible(currency);
    }
  }
}
