import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";

export class AssetsPage extends AppPage {
  readonly cryptosSectionHeader = this.page.getByTestId("cryptos-section-header-button");
  readonly stablecoinsSectionHeader = this.page.getByTestId("stablecoins-section-header-button");
  readonly cryptosSection = this.page.getByTestId("cryptos-section");
  readonly cryptosSectionRows = this.cryptosSection.locator("tbody tr");
  readonly stablecoinsSection = this.page.getByTestId("stablecoins-section");
  readonly stablecoinsSectionRows = this.stablecoinsSection.locator("tbody tr");
  readonly cryptoAddressesBanner = this.page.getByTestId("crypto-addresses-banner");
  readonly addAccountCTA = this.cryptoAddressesBanner.getByTestId(
    "crypto-addresses-banner-add-account-cta",
  );
  readonly cryptoAssetPageContent = this.page.getByTestId("crypto-assets-page-content");

  @step("Wait for asset sections to load")
  async waitForAssetsToLoad() {
    await this.cryptosSectionHeader.waitFor();
    await this.stablecoinsSectionHeader.waitFor();
  }

  @step("Click cryptos section header")
  async clickCryptosHeader() {
    await this.cryptosSectionHeader.click();
    await this.cryptoAssetPageContent.waitFor({ state: "visible" });
  }

  @step("Click stablecoins section header")
  async clickStablecoinsHeader() {
    await this.stablecoinsSectionHeader.click();
    await this.cryptoAssetPageContent.waitFor({ state: "visible" });
  }

  @step("Click 'Add account' CTA from crypto addresses banner")
  async clickAddAccountBannerCTA() {
    await this.addAccountCTA.click();
  }

  @step("Expect crypto addresses banner to be visible")
  async expectBannerVisible() {
    await expect(this.cryptoAddressesBanner).toBeVisible();
  }

  @step("Expect 'Add account' CTA to be visible in crypto addresses banner")
  async expectAddAccountCTAVisible() {
    await expect(this.addAccountCTA).toBeVisible();
  }

  @step("Expect 'Add account' CTA not to be visible in crypto addresses banner")
  async expectAddAccountCTANotVisible() {
    await expect(this.addAccountCTA).not.toBeVisible();
  }

  @step("Count visible rows in cryptos section")
  async countCryptosRows(): Promise<number> {
    return this.cryptosSectionRows.count();
  }

  @step("Count visible rows in stablecoins section")
  async countStablecoinsRows(): Promise<number> {
    return this.stablecoinsSectionRows.count();
  }

  @step("Click asset in cryptos section")
  async clickAssetInCryptosSection(assetName: string) {
    await this.cryptosSection.getByText(assetName, { exact: true }).click();
  }

  @step("Expect asset to be visible in cryptos section")
  async expectAssetVisibleInCryptosSection(assetName: string) {
    await expect(this.cryptosSection.getByText(assetName, { exact: true })).toBeVisible();
  }

  @step("Click asset in stablecoins section")
  async clickAssetInStablecoinsSection(assetName: string) {
    await this.stablecoinsSection.getByText(assetName, { exact: true }).click();
  }

  @step("Expect a single aggregated row for asset $1 in $0 section")
  async expectSingleAggregatedRow(section: "cryptos" | "stablecoins", assetName: string) {
    const rows = section === "cryptos" ? this.cryptosSectionRows : this.stablecoinsSectionRows;
    const matchingRows = rows.filter({ hasText: assetName });
    await expect(matchingRows).toHaveCount(1);
  }
}
