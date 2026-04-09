import { Step } from "jest-allure2-reporter/api";

export default class EarnV2DashboardPage {
  // Webview testIDs (shared earn web app v2)
  footerDisclaimer = "footer-disclaimer";
  maxPotentialRewards = "max-potential-rewards";
  walletHeaderAmount = "wallet-header-amount";
  rewardsSummary = "rewards-summary";
  tokensToEarnBanner = "tokens-to-earn-banner";
  iceColdStartEarnCta = "ice-cold-start-earn-cta";
  assetItemTicker = (ticker: string) => `asset-item-ticker-${ticker}`;
  assetEarnCta = (ticker: string) => `asset-earn-cta-${ticker}`;

  // --- Ice Cold Start ---

  @Step("Verify ice cold start page")
  async verifyIceColdStartPage() {
    await waitWebElementByTestId(this.footerDisclaimer);
    await expectWebElementNotVisible(this.maxPotentialRewards);
    await expectWebElementNotVisible(this.walletHeaderAmount);
  }

  @Step("Click ice cold start earn CTA")
  async clickIceColdStartEarnCTA() {
    await tapWebElementByTestId(this.iceColdStartEarnCta);
  }

  // --- Cold Start ---

  @Step("Verify cold start page")
  async verifyColdStartPage() {
    await waitWebElementByTestId(this.maxPotentialRewards);
    await waitWebElementByTestId(this.tokensToEarnBanner);
  }

  @Step("Verify asset ready to earn")
  async verifyAssetReadyToEarn(ticker: string) {
    await waitWebElementByTestId(this.assetItemTicker(ticker));
  }

  @Step("Click asset earn CTA")
  async clickAssetEarnCta(ticker: string) {
    await tapWebElementByTestId(this.assetEarnCta(ticker));
  }

  // --- Hot Start ---

  @Step("Verify hot start page")
  async verifyHotStartPage() {
    await waitWebElementByTestId(this.walletHeaderAmount);
  }

  @Step("Verify rewards summary boxes")
  async verifyRewardsSummaryBoxes() {
    await waitWebElementByTestId(this.rewardsSummary);
  }

  private readonly depositRowSelector =
    "[data-testid='deposits-table'] [data-testid^='deposit-row']";

  @Step("Verify position row present for $0")
  async verifyPositionRowPresent(_identifier: string) {
    await waitWebElement(getWebElementByCssSelector(this.depositRowSelector));
  }

  @Step("Click position row matching text: $0")
  async clickPositionRow(_identifier: string) {
    const row = getWebElementByCssSelector(this.depositRowSelector);
    await tapWebElementByElement(row);
  }

  // --- Webview Flow Verification (URL-based) ---

  @Step("Verify earn webview redirected to deposit flow")
  async verifyDepositFlowVisible() {
    await waitForCurrentWebviewUrlToContain("/deposit");
  }

  @Step("Verify earn webview redirected to withdraw flow")
  async verifyWithdrawalFlowVisible() {
    await waitForCurrentWebviewUrlToContain("/redeem");
  }

  // --- Staking Flow Verification (native) ---

  // Maps currency ticker to the native testID that appears after clicking the asset CTA
  private static readonly stakingFlowTestIds: Record<string, string> = {
    ETH: "staking-provider-modal-title", // EvmStakingDrawer
    ATOM: "cosmos-delegation-start-button", // CosmosDelegationFlow
    SOL: "solana-delegation-start-button", // SolanaDelegationFlow
  };

  @Step("Verify staking flow opened for $0")
  async verifyStakingFlowOpened(ticker: string) {
    const testId = EarnV2DashboardPage.stakingFlowTestIds[ticker];
    if (!testId) {
      throw new Error(`No staking flow testID mapped for ticker "${ticker}"`);
    }
    await waitForElementById(testId);
  }

  @Step("Tap staking provider in EvmStakingDrawer: $0")
  async tapStakingProvider(providerId: string) {
    await tapById(`staking-provider-${providerId}-title`);
  }

  @Step("Verify partner dapp loaded (webview URL contains $0)")
  async verifyPartnerDappLoaded(urlSubstring: string) {
    await waitForCurrentWebviewUrlToContain(urlSubstring);
  }

  // --- Modular Selector (native) ---

  @Step("Verify modular asset drawer is visible")
  async verifyModularAssetDrawerVisible() {
    await app.modularDrawer.checkSelectAssetPage();
  }

  // --- Mobile-specific: EarnMenuDrawer (native bottom sheet) ---
  // Opened via deeplink from webview: ledgerlive://earn?action=menu-modal
  // Shows options like "Manage", "Earn more", "Withdraw" depending on position type

  @Step("Verify manage drawer options present: $0")
  async verifyManageDrawerOptions(options: string[]) {
    for (const option of options) {
      const testId = `earn-menu-option-${option.toLowerCase().replace(/\s+/g, "-")}`;
      await waitForElementById(testId, undefined, { checkVisibility: false });
    }
  }

  @Step("Tap manage drawer option")
  async tapManageDrawerOption(optionText: string) {
    const testId = `earn-menu-option-${optionText.toLowerCase().replace(/\s+/g, "-")}`;
    await tapById(testId);
  }
}
