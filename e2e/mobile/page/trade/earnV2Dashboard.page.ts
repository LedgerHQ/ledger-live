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

  // ETH deposit flow locators (earn v2 webview)
  ethProviderPanel = "eth-provider-panel";
  ethProviderCard = (providerId: string) => `eth-provider-card-${providerId}`;
  ethDepositAmountInput = "amount-input-section-input";
  ethDepositAmountContinueCta = "amount-continue-cta";
  ethDepositProviderContinueCta = "text-button-cta";

  // Native locators
  stakingProvider = (providerId: string) => `staking-provider-${providerId}-title`;
  earnMenuOption = (label: string) =>
    `earn-menu-option-${label.toLowerCase().replace(/\s+/g, "-")}`;
  private static readonly stakingFlowTestIds: Record<string, string | RegExp> = {
    ATOM: /^(enabled-|disabled-)?cosmos-delegation-start-button$/,
    SOL: /^(enabled-|disabled-)?solana-delegation-start-button$/,
  };

  // Maps legacy staking-provider modal IDs to earn deposit screen provider card IDs
  private static readonly ethDepositProviderCardIds: Record<string, string> = {
    kiln_pooling: "kiln-ethereum-pooling",
    lido: "lido",
    "stader-eth": "stader-eth",
  };

  private static readonly ethDepositAmount = "0.01";

  // --- Ice Cold Start ---

  @Step("Wait for and verify ice cold start page")
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

  // --- Earn CTA flow verification ---

  @Step("Verify earn CTA flow opened for $0")
  async verifyEarnCtaFlowOpened(ticker: string) {
    if (ticker === "ETH") {
      await this.verifyEthDepositFlowOpened();
      return;
    }
    await this.verifyStakingFlowOpened(ticker);
  }

  @Step("Verify ETH deposit flow opened in earn webview")
  async verifyEthDepositFlowOpened() {
    await this.verifyDepositFlowVisible();
    await waitWebElementByTestId(this.ethDepositAmountContinueCta);
  }

  @Step("Complete ETH deposit amount step")
  async completeEthDepositAmountStep(amount: string = EarnV2DashboardPage.ethDepositAmount) {
    await typeTextByWebTestId(this.ethDepositAmountInput, amount);
    await tapWebElementByTestId(this.ethDepositAmountContinueCta);
  }

  @Step("Verify ETH provider panel is visible")
  async verifyEthProviderPanelVisible() {
    await waitWebElementByTestId(this.ethProviderPanel);
  }

  @Step("Tap ETH deposit provider card: $0")
  async tapEthDepositProvider(providerId: string) {
    const cardId = EarnV2DashboardPage.ethDepositProviderCardIds[providerId] ?? providerId;
    await tapWebElementByTestId(this.ethProviderCard(cardId));
  }

  @Step("Tap ETH deposit provider continue CTA")
  async tapEthDepositProviderContinue() {
    await tapWebElementByTestId(this.ethDepositProviderContinueCta);
  }

  @Step("Navigate ETH deposit flow to partner dapp via provider: $0")
  async navigateEthDepositToPartnerDapp(providerId: string) {
    await this.verifyEthDepositFlowOpened();
    await this.completeEthDepositAmountStep();
    await this.verifyEthProviderPanelVisible();
    await this.tapEthDepositProvider(providerId);
    await this.tapEthDepositProviderContinue();
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
