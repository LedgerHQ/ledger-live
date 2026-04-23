import { expect, Locator, Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { AssetCategory } from "./assetSection";
import { PageHeader } from "tests/component/pageHeader.component";

export class CryptoAssetsPage extends AppPage {
  readonly category: AssetCategory;
  readonly header = new PageHeader(this.page);
  readonly content: Locator;
  constructor(page: Page, category: AssetCategory) {
    super(page);
    this.category = category;
    this.content = this.page.getByTestId("crypto-assets-page-content");
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
}
