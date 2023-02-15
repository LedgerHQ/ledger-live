import { Page, Locator } from "@playwright/test";

export class AssetPage {
  readonly page: Page;
  readonly stakeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.stakeButton = page.locator("data-test-id=asset-page-stake-button");
  }

  async startStakeFlow() {
    await this.stakeButton.click();
    await this.page.getByText("Choose Account").waitFor({ state: "visible" });
  }
}
