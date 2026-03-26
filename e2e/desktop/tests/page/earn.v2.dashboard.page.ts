import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { EarnBasePage } from "./earn.base.page";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import type { Application } from "./index";

export class EarnV2Page extends EarnBasePage {
  private readonly maxPotentialRewards = "max-potential-rewards";
  private readonly walletHeaderAmount = "wallet-header-amount";
  private readonly rewardsSummary = "rewards-summary";
  private readonly tokensToEarnBanner = "tokens-to-earn-banner";
  private readonly footerDisclaimer = "footer-disclaimer";
  private readonly assetItemTicker = (ticker: string) =>
    `asset-item-ticker-${ticker.toLowerCase()}`;

  // Ice Cold Start

  @step("Verify ice cold start page")
  async verifyIceColdStartPage() {
    await this.verifyElementIsVisible(this.footerDisclaimer);
    await this.verifyElementIsNotVisible(this.maxPotentialRewards);
    await this.verifyElementIsNotVisible(this.walletHeaderAmount);
  }

  @step("Click ice cold start earn CTA")
  async clickIceColdStartEarnCTA() {
    const webview = await this.getWebView();
    await webview.getByTestId("ice-cold-start-earn-cta").click();
  }

  // Cold Start

  @step("Verify cold start page")
  async verifyColdStartPage() {
    await this.verifyElementIsVisible(this.maxPotentialRewards);
    await this.verifyElementIsVisible(this.tokensToEarnBanner);
  }

  @step("Verify asset ready to earn: $0")
  async verifyAssetReadyToEarn(ticker: string) {
    await this.verifyElementIsVisible(this.assetItemTicker(ticker));
  }

  @step("Click asset earn CTA for $0")
  async clickAssetEarnCta(ticker: string) {
    const webview = await this.getWebView();
    await webview.getByTestId(`asset-earn-cta-${ticker.toLowerCase()}`).click();
  }

  // Hot Start

  @step("Verify hot start page")
  async verifyHotStartPage() {
    await this.verifyElementIsVisible(this.walletHeaderAmount);
  }

  @step("Verify rewards summary boxes")
  async verifyRewardsSummaryBoxes() {
    await this.verifyElementIsVisible(this.rewardsSummary);
  }

  @step("Verify position row present: $0")
  async verifyPositionRowPresent(identifier: string) {
    const webview = await this.getWebView();
    const row = webview.getByTestId(/^deposit-row-/).filter({ hasText: identifier });
    await expect(row.first()).toBeVisible();
  }

  @step("Click position row: $0")
  async clickPositionRow(identifier: string) {
    const webview = await this.getWebView();
    const row = webview.getByTestId(/^deposit-row-/).filter({ hasText: identifier });
    await row.first().click();
  }

  // Navigation

  @step("Verify navigated away from earn dashboard")
  async verifyNavigatedFromDashboard() {
    await this.verifyElementIsNotVisible(this.tokensToEarnBanner);
    await this.verifyElementIsNotVisible(this.maxPotentialRewards);
  }

  @step("Verify navigated to deposit flow")
  async verifyDepositFlowVisible() {
    const webview = await this.getWebView();
    await expect(webview).toHaveURL(/\/deposit/);
  }

  @step("Verify navigated to withdrawal flow")
  async verifyWithdrawalFlowVisible() {
    const webview = await this.getWebView();
    await expect(webview).toHaveURL(/\/redeem|intent=withdraw/);
  }

  @step("Select account in modular selector: $0")
  async selectAccountInModularSelector(app: Application, account: Account) {
    const selector = await getModularSelector(app, "ACCOUNT");
    if (selector) {
      await selector.selectAccount(account);
      await expect(
        this.page
          .getByTestId("modular-drawer-screen-ACCOUNT_SELECTION")
          .or(this.page.getByTestId("modular-dialog-screen-ACCOUNT_SELECTION")),
      ).toBeHidden();
    }
  }

  @step("Get stake platform for currency: $0")
  async getStakePlatform(currencyId: string): Promise<string | null> {
    const webview = await this.getWebView();
    const url = webview.url();
    const param = new URL(url).searchParams.get("stakeProgramsParam");
    if (!param) return null;
    const redirects: Record<string, string> = JSON.parse(param);
    return redirects[currencyId] ?? null;
  }
}
