import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { EarnBasePage } from "tests/page/earn.base.page";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import type { Application } from "tests/page/index";

export class EarnV2Page extends EarnBasePage {
  private readonly maxPotentialRewards = "max-potential-rewards";
  private readonly walletHeaderAmount = "wallet-header-amount";
  private readonly rewardsSummary = "rewards-summary";
  private readonly crowdFavourites = "crowd-favourites";
  private readonly footerDisclaimer = "footer-disclaimer";
  private readonly assetItemTicker = (ticker: string) =>
    `asset-item-ticker-${ticker.toLowerCase()}`;
  private readonly simulateInvestmentCta = "simulate-investment-cta";
  private readonly earnSimulatorTestId = "earn-simulator";
  private readonly earnSimulatorCta = "earn-simulator-cta";
  private readonly accountSelectorInput = "account-selector-input";
  private readonly v1TextButtonCta = "text-button-cta";
  private readonly modalContainer = this.page.getByTestId("modal-container");

  // Ice Cold Start

  @step("Verify ice cold start page")
  async verifyIceColdStartPage() {
    await this.verifyElementIsVisible(this.footerDisclaimer);
    await this.verifyElementIsNotVisible(this.maxPotentialRewards);
    await this.verifyElementIsNotVisible(this.walletHeaderAmount);
  }

  @step("Click simulate investment CTA")
  async clickSimulateInvestmentCta() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.simulateInvestmentCta).click();
  }

  @step("Verify earn simulator is visible")
  async verifyEarnSimulatorVisible() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.earnSimulatorTestId)).toBeVisible();
  }

  @step("Click earn simulator CTA")
  async clickEarnSimulatorCta() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.earnSimulatorCta).click();
  }

  @step("Click account selector input in deposit screen")
  async clickAccountSelectorInput() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.accountSelectorInput).click();
  }

  @step("Verify v1 deposit text-button-cta is visible")
  async verifyV1TextButtonCtaVisible() {
    const webview = await this.getWebView();
    const cta = webview.getByTestId(this.v1TextButtonCta);
    await expect(cta).toBeVisible();
    // v2 reuses this test id for the in-card "Continue" button, so the label tells the screens apart.
    await expect(cta).toHaveText(/Deposit in/i);
  }

  // Cold Start

  @step("Verify cold start page")
  async verifyColdStartPage() {
    await this.verifyElementIsVisible(this.maxPotentialRewards);
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.crowdFavourites)).toBeVisible();
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

  @step("Verify modal container is visible")
  async verifyModalContainerVisible() {
    await expect(this.modalContainer).toBeVisible();
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

  // Deposit screen v2 (swapToEarn enabled)

  private readonly amountInput = "amount-input-section-input";
  private readonly amountPresets = "amount-presets";
  private readonly amountPreset = (preset: "25" | "50" | "75" | "max") => `amount-preset-${preset}`;
  private readonly ethProviderAllCategory = "category-filter-all";
  private readonly ethProviderCard = (providerId: string) =>
    `eth-provider-card-${EarnV2Page.ethProviderCardIds[providerId] ?? providerId}`;

  @step("Verify deposit screen v2 amount section")
  async verifyV2DepositScreenVisible() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.accountSelectorInput)).toBeVisible();
    await expect(webview.getByTestId(this.amountPresets)).toBeVisible();
  }

  @step("Select deposit amount preset: $0")
  async selectAmountPreset(preset: "25" | "50" | "75" | "max") {
    const webview = await this.getWebView();
    await webview.getByTestId(this.amountPreset(preset)).click();
    // The preset value depends on the live balance, so only check that it filled the input.
    await expect(webview.getByTestId(this.amountInput)).not.toHaveValue(/^0?$/);
  }

  @step("Enter deposit amount: $0")
  async enterDepositAmount(amount: string) {
    const webview = await this.getWebView();
    const input = webview.getByTestId(this.amountInput);
    // fill() writes the DOM value without React onChange, so the controlled Lumen input snaps back to 0.
    await input.click();
    await input.pressSequentially(amount);
    await expect(input).toHaveValue(amount);
  }

  @step("Select ETH provider in deposit v2 flow: $0")
  async selectEthProviderV2(providerId: string) {
    const webview = await this.getWebView();
    await webview.getByTestId(this.ethProviderPanel).waitFor({ state: "visible" });
    // The filter renders with the panel, and only for the basic_sorting and iso_modal cohorts.
    // The account Stake entry can open this screen without that cohort, so All is not always there.
    const allCategory = webview.getByTestId(this.ethProviderAllCategory);
    if (await allCategory.isVisible()) {
      await allCategory.click();
    }
    await webview.getByTestId(this.ethProviderCard(providerId)).click();
  }

  @step("Verify Continue is enabled only in selected ETH provider: $0")
  async verifyEthProviderContinueEnabled(providerId: string) {
    const webview = await this.getWebView();
    const card = webview.getByTestId(this.ethProviderCard(providerId));
    const continueCta = card.getByTestId(this.v1TextButtonCta);
    await expect(continueCta).toBeVisible();
    await expect(continueCta).toHaveText(/Continue/i);
    await expect(continueCta).toBeEnabled();
    await expect(webview.getByTestId(this.v1TextButtonCta)).toHaveCount(1);
  }

  @step("Continue with selected ETH provider: $0")
  async continueWithSelectedEthProvider(providerId: string) {
    await this.verifyEthProviderContinueEnabled(providerId);
    const webview = await this.getWebView();
    await webview
      .getByTestId(this.ethProviderCard(providerId))
      .getByTestId(this.v1TextButtonCta)
      .click();
  }

  // Navigation
  @step("Verify navigated to deposit flow")
  async verifyDepositFlowVisible() {
    const webview = await this.getWebView();
    await expect(webview).toHaveURL(/^(?!.*\/v2\/).*\/deposit/);
  }

  @step("Verify navigated to deposit v2 flow")
  async verifyV2DepositFlowVisible() {
    const webview = await this.getWebView();
    await expect(webview).toHaveURL(/\/v2\/[^/]+\/deposit/);
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
    // Multi-network assets (e.g. ETH) trigger a network chooser after asset selection.
    if (await app.modularDialog.waitForNetworkDialogVisible(5000)) {
      await app.modularDialog.selectNetwork(currency);
    }
  }

  @step("Add existing account via modular selector")
  async addExistingAccountViaModularSelector(app: Application) {
    const selector = await getModularSelector(app, "ACCOUNT");
    expect(selector, "Expected ACCOUNT modular selector to be visible").not.toBeNull();
    await selector!.clickOnAddAndExistingAccount();
  }
}
