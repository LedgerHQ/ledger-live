import { Step } from "jest-allure2-reporter/api";

export default class EarnV2DashboardPage {
  // Webview locators (shared earn web app v2)
  footerDisclaimer = "footer-disclaimer";
  maxPotentialRewards = "max-potential-rewards";
  walletHeaderAmount = "wallet-header-amount";
  rewardsSummary = "rewards-summary";
  tokensToEarnBanner = "tokens-to-earn-banner";
  iceColdStartEarnCta = "ice-cold-start-earn-cta";
  assetItemTicker = (ticker: string) => `asset-item-ticker-${ticker}`;
  assetEarnCta = (ticker: string) => `asset-earn-cta-${ticker}`;
  depositRowXPath = (identifier: string) =>
    `//*[starts-with(@data-testid, "deposit-row-") and .//*[contains(text(), "${identifier}")]]`;

  // Native locators
  stakingProvider = (providerId: string) => `staking-provider-${providerId}-title`;
  earnMenuOption = (label: string) =>
    `earn-menu-option-${label.toLowerCase().replace(/\s+/g, "-")}`;
  private static readonly stakingFlowTestIds: Record<string, string> = {
    ETH: "staking-provider-modal-title",
    ATOM: "cosmos-delegation-start-button",
    SOL: "solana-delegation-start-button",
  };

  // --- Ice Cold Start ---

  @Step("Wait for ice cold start page to load")
  async waitForIceColdStartPage() {
    await waitWebElementByTestId(this.footerDisclaimer);
  }

  @Step("Verify ice cold start page")
  async verifyIceColdStartPage() {
    await expectWebElementNotVisible(this.maxPotentialRewards);
    await expectWebElementNotVisible(this.walletHeaderAmount);
  }

  @Step("Click ice cold start earn CTA")
  async clickIceColdStartEarnCTA() {
    await tapWebElementByTestId(this.iceColdStartEarnCta);
  }

  // --- Cold Start ---

  @Step("Wait for cold start page to load")
  async waitForColdStartPage() {
    await waitWebElementByTestId(this.maxPotentialRewards);
  }

  @Step("Verify cold start page")
  async verifyColdStartPage() {
    await detoxExpect(getWebElementByTestId(this.tokensToEarnBanner)).toExist();
  }

  @Step("Verify asset ready to earn")
  async verifyAssetReadyToEarn(ticker: string) {
    await detoxExpect(getWebElementByTestId(this.assetItemTicker(ticker))).toExist();
  }

  @Step("Click asset earn CTA")
  async clickAssetEarnCta(ticker: string) {
    await tapWebElementByTestId(this.assetEarnCta(ticker));
  }

  // --- Hot Start ---

  @Step("Wait for hot start page to load")
  async waitForHotStartPage() {
    await waitWebElementByTestId(this.walletHeaderAmount);
  }

  @Step("Verify rewards summary boxes")
  async verifyRewardsSummaryBoxes() {
    await detoxExpect(getWebElementByTestId(this.rewardsSummary)).toExist();
  }

  @Step("Verify position row present for $0")
  async verifyPositionRowPresent(identifier: string) {
    await detoxExpect(getWebElementByXpath(this.depositRowXPath(identifier))).toExist();
  }

  @Step("Click position row for $0")
  async clickPositionRow(identifier: string) {
    const row = getWebElementByXpath(this.depositRowXPath(identifier));
    await tapWebElementByElement(row);
  }

  // --- Webview Flow Verification (URL-based) ---

  @Step("Verify earn webview redirected to deposit flow")
  async verifyDepositFlowVisible() {
    const url = await waitForCurrentWebviewUrlToContain("/deposit");
    jestExpect(url.toLowerCase()).toContain("/deposit");
  }

  @Step("Verify earn webview redirected to withdraw flow")
  async verifyWithdrawalFlowVisible() {
    const url = await waitForCurrentWebviewUrlToContain("/redeem");
    jestExpect(url.toLowerCase()).toContain("/redeem");
  }

  // --- Staking Flow Verification (native) ---

  @Step("Verify staking flow opened for $0")
  async verifyStakingFlowOpened(ticker: string) {
    const testId = EarnV2DashboardPage.stakingFlowTestIds[ticker];
    if (!testId) {
      throw new Error(`No staking flow testID mapped for ticker "${ticker}"`);
    }
    await detoxExpect(getElementById(testId)).toBeVisible();
  }

  @Step("Tap staking provider in EvmStakingDrawer: $0")
  async tapStakingProvider(providerId: string) {
    await tapById(this.stakingProvider(providerId));
  }

  @Step("Verify partner dapp loaded (webview URL contains $0)")
  async verifyPartnerDappLoaded(urlSubstring: string) {
    const url = await waitForCurrentWebviewUrlToContain(urlSubstring);
    jestExpect(url.toLowerCase()).toContain(urlSubstring.toLowerCase());
  }

  // --- Modular Selector (native) ---

  @Step("Verify modular asset drawer is visible")
  async verifyModularAssetDrawerVisible() {
    await app.modularDrawer.checkSelectAssetPage();
  }

  // --- EarnMenuDrawer (native bottom sheet) ---

  @Step("Wait for manage drawer and verify options present: $0")
  async waitForManageDrawerAndVerifyOptions(options: string[]) {
    await waitForElementById(this.earnMenuOption(options[0]));
    for (const option of options) {
      await detoxExpect(getElementById(this.earnMenuOption(option))).toExist();
    }
  }

  @Step("Tap manage drawer option")
  async tapManageDrawerOption(optionText: string) {
    await tapById(this.earnMenuOption(optionText));
  }
}
