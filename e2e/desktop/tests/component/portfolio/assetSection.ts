import { expect, Locator, Page } from "@playwright/test";
import { Component } from "../../page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import { AssetsTable } from "./assetsTable";

export type AssetCategory = "cryptos" | "stablecoins";

export class AssetSection extends Component {
  readonly section: Locator;
  readonly header: Locator;
  readonly assetsTable: AssetsTable;
  constructor(page: Page, sectionId: AssetCategory) {
    super(page);
    this.section = this.page.getByTestId(`${sectionId}-section`);
    this.header = this.section.getByTestId(`${sectionId}-section-header-button`);
    this.assetsTable = new AssetsTable(this.section);
  }

  @step("Expect section header to be visible")
  async expectHeaderVisible() {
    await expect(this.header).toBeVisible();
  }
}
