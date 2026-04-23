import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { AssetSection } from "./assetSection";
import { CryptoAssetsPage } from "./cryptoAssets.page";

export class AssetsPage extends AppPage {
  readonly cryptoAddressesBanner = this.page.getByTestId("crypto-addresses-banner");
  readonly addAccountCTA = this.cryptoAddressesBanner.getByTestId(
    "crypto-addresses-banner-add-account-cta",
  );

  readonly cryptoAssetsPage = new CryptoAssetsPage(this.page, "cryptos");
  readonly stablecoinsAssetsPage = new CryptoAssetsPage(this.page, "stablecoins");
  readonly cryptosSection = new AssetSection(this.page, "cryptos");
  readonly stablecoinsSection = new AssetSection(this.page, "stablecoins");

  @step("Wait for asset sections to load")
  async waitForAssetsToLoad() {
    await this.cryptosSection.header.waitFor();
    await this.stablecoinsSection.header.waitFor();
  }

  @step("Click cryptos section header")
  async clickCryptosHeader() {
    await this.cryptosSection.header.click();
    await this.cryptoAssetsPage.content.waitFor();
  }

  @step("Click stablecoins section header")
  async clickStablecoinsHeader() {
    await this.stablecoinsSection.header.click();
    await this.stablecoinsAssetsPage.content.waitFor();
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
}
