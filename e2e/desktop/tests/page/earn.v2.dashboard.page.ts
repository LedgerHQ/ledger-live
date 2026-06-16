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
  private readonly iceColdStartEarnCta = "ice-cold-start-earn-cta";
  private readonly modalContainer = this.page.getByTestId("modal-container");

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
    await webview.getByTestId(this.iceColdStartEarnCta).click();
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
    const row = webview.getByTestId(/^deposit-row-/).filter({ hasText: new RegExp(identifier) });
    await expect(row.first()).toBeVisible();
  }

  @step("Click position row: $0")
  async clickPositionRow(identifier: string) {
    const webview = await this.getWebView();
    const row = webview.getByTestId(/^deposit-row-/).filter({ hasText: new RegExp(identifier) });
    await row.first().click();
  }

  @step("Expect modular selector to be visible and validate items: $0")
  async expectModularSelectorToBeVisible(app: Application, type: "ASSET" | "ACCOUNT") {
    const selector = await getModularSelector(app, type);
    expect(selector, `Expected ${type} modular selector to be visible`).not.toBeNull();
    await selector!.validateItems();
  }

  @step("Verify modal container is visible")
  async verifyModalContainerVisible() {
    await expect(this.modalContainer).toBeVisible();
  }

  @step("Verify provider is visible inside modal")
  async verifyProviderVisible() {
    await expect(
      this.modalContainer.getByTestId(/stake-provider-container-/).first(),
    ).toBeVisible();
  }

  private readonly ethProviderPanel = "eth-provider-panel";
  private readonly ethProviderAllFilterChip = "filter-chip-all";
  // The provider card test id suffix is the backend `ID` enum value, which differs from the e2e
  // provider value, so map the providers we exercise.
  private static readonly ethProviderCardIds: Record<string, string> = {
    lido: "Lido",
    kiln_pooling: "KilnEthereumPooling",
    "stader-eth": "stader-eth",
  };

  @step("Select ETH provider in deposit flow: $0")
  async selectEthProvider(providerId: string) {
    const webview = await this.getWebView();
    // The provider panel only renders once the staking providers have loaded.
    await webview.getByTestId(this.ethProviderPanel).waitFor({ state: "visible" });
    // basic_sorting / iso_modal cohorts default to a category-filtered view ("Protocol" for
    // >=32 ETH, "Liquid" otherwise), which can hide the target provider. Reset to "All" so any
    // provider is selectable regardless of the account balance.
    const allFilterChip = webview.getByTestId(this.ethProviderAllFilterChip);
    if (await allFilterChip.isVisible()) {
      await allFilterChip.click();
    }
    const cardId = EarnV2Page.ethProviderCardIds[providerId] ?? providerId;
    await webview.getByTestId(`eth-provider-card-${cardId}`).click();
  }

  @step("Confirm deposit in selected ETH provider")
  async depositInSelectedProvider() {
    const webview = await this.getWebView();
    // The CTA label only becomes "Deposit in {provider}" once a provider is actually selected,
    // so requiring it also proves the card click registered (guards against a no-op selection).
    const depositCta = webview.getByRole("button", { name: /Deposit in/i });
    await expect(depositCta).toBeVisible();
    await expect(depositCta).toBeEnabled();
    await depositCta.click();
  }

  // Navigation
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

  @step("Select asset in modular selector: $0")
  async selectAssetInModularSelector(app: Application, currency: Account["currency"]) {
    const selector = await getModularSelector(app, "ASSET");
    expect(selector, "Expected ASSET modular selector to be visible").not.toBeNull();
    await selector!.selectAsset(currency);
  }

  @step("Add existing account via modular selector")
  async addExistingAccountViaModularSelector(app: Application) {
    const selector = await getModularSelector(app, "ACCOUNT");
    expect(selector, "Expected ACCOUNT modular selector to be visible").not.toBeNull();
    await selector!.clickOnAddAndExistingAccount();
  }
}
