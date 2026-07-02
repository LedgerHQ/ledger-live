import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { Component } from "../../page/abstractClasses";

export class CryptoAddressesBanner extends Component {
  readonly root = this.page.getByTestId("crypto-addresses-banner");
  readonly addAccountCTA = this.root.getByTestId("crypto-addresses-banner-add-account-cta");

  @step("Expect crypto addresses banner to be visible")
  async expectBannerVisible() {
    await expect(this.root).toBeVisible();
  }

  @step("Expect 'Add account' CTA to be visible in crypto addresses banner")
  async expectAddAccountCTAVisible() {
    await this.addAccountCTA.waitFor({ state: "attached" });
    await this.addAccountCTA.scrollIntoViewIfNeeded();
    await expect(this.addAccountCTA).toBeVisible();
  }

  @step("Expect 'Add account' CTA not to be visible in crypto addresses banner")
  async expectAddAccountCTANotVisible() {
    await expect(this.addAccountCTA).not.toBeVisible();
  }
}
