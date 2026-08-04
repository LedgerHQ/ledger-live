import { Step } from "jest-allure2-reporter/api";

export default class EarnV2DashboardPage {
  // Webview locators (shared earn web app v2)
  footerDisclaimer = "footer-disclaimer";
  maxPotentialRewards = "max-potential-rewards";
  walletHeaderAmount = "wallet-header-amount";
  rewardsSummary = "rewards-summary";
  crowdFavourites = "crowd-favourites";
  iceColdStartEarnCta = "ice-cold-start-earn-cta";
  assetItemTicker = (ticker: string) => `asset-item-ticker-${ticker}`;
  assetEarnCta = (ticker: string) => `asset-earn-cta-${ticker}`;
  depositRowXPath = (identifier: string) =>
    `//*[starts-with(@data-testid, "deposit-row-") and .//*[contains(text(), "${identifier}")]]`;

  // Native locators
  stakingProvider = (providerId: string) => `staking-provider-${providerId}-title`;
  earnMenuOption = (label: string) =>
    `earn-menu-option-${label.toLowerCase().replace(/\s+/g, "-")}`;
  private static readonly stakingFlowTestIds: Record<string, string | RegExp> = {
    ATOM: /^(enabled-|disabled-)?cosmos-delegation-start-button$/,
    SOL: /^(enabled-|disabled-)?solana-delegation-start-button$/,
  };

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
    await waitWebElementByTestId(this.crowdFavourites);
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

  @Step("Verify earn flow started for $0")
  async verifyEarnFlowStarted(ticker: string) {
    // ETH is redirected into the earn deposit webview (stakePrograms redirect) rather than
    // opening a native staking drawer, so it is verified by URL instead of a native test id.
    if (ticker === "ETH") {
      await this.verifyDepositFlowVisible();
    } else {
      await this.verifyStakingFlowOpened(ticker);
    }
  }

  // --- ETH deposit webview flow (amount -> provider -> partner dapp) ---

  // swapToEarn is forwarded to the earn webview URL, and the earn app's proxy routes on it:
  // enabled -> /v2/<os>/deposit, disabled -> /<os>/deposit. The two flows are separate screens
  // with different test ids, so keep the v1 and v2 selectors distinct.
  ethAmountInput = "amount-input-section-input"; // shared: both flows render this
  ethAmountContinueCta = "input-button-mobile"; // v1 only
  v2AmountContinueCta = "amount-continue-cta"; // v2 only
  ethProviderPanel = "eth-provider-panel";
  ethProviderAllFilterChip = "filter-chip-all"; // v1 only; v2 uses a segmented control
  ethDepositProviderCta = "select-provider-button-mobile"; // v1 only
  ethProviderDepositCta = (cardId: string) => `eth-provider-deposit-${cardId}`;
  // The provider card test id suffix is the backend `ID` enum value, which differs from the e2e
  // provider value, so map the providers we exercise.
  private static readonly ethProviderCardIds: Record<string, string> = {
    lido: "Lido",
    kiln_pooling: "KilnEthereumPooling",
    "stader-eth": "stader-eth",
  };

  private static resolveEthProviderCardId(providerId: string) {
    return EarnV2DashboardPage.ethProviderCardIds[providerId] ?? providerId;
  }

  private ethProviderCardTestId(providerId: string) {
    return `eth-provider-card-${EarnV2DashboardPage.resolveEthProviderCardId(providerId)}`;
  }

  @Step("Complete ETH deposit amount step with $0 ETH")
  async completeEthDepositAmountStep(amount: string) {
    await waitWebElementByTestId(this.ethAmountInput);
    await typeTextByWebTestId(this.ethAmountInput, amount);
    await waitForWebElementToBeEnabled(this.ethAmountContinueCta);
    await tapWebElementByTestId(this.ethAmountContinueCta);
  }

  @Step("Select ETH provider $0 in deposit webview")
  async selectEthProviderInWebview(providerId: string) {
    await waitWebElementByTestId(this.ethProviderPanel);
    // The ETH partner-dapp flags pin the deposit cohort to basic_sorting, so the category filter bar
    // always renders. Its default filter (protocol/liquid) hides providers in other categories (e.g.
    // Kiln is "pooling"), so reset to "All" to make any provider selectable. Tapping directly (no
    // presence guard) asserts the chip exists — a regression in the filter bar fails loudly.
    await tapWebElementByTestId(this.ethProviderAllFilterChip);
    await tapWebElementByTestId(this.ethProviderCardTestId(providerId));
  }

  @Step("Confirm ETH deposit provider selection")
  async confirmEthDepositProvider() {
    await waitForWebElementToBeEnabled(this.ethDepositProviderCta);
    await tapWebElementByTestId(this.ethDepositProviderCta);
  }

  // --- swapToEarn routing variants ---

  // The earn app redirects "/" to /v2/<os>/deposit or /<os>/deposit based on the swapToEarn URL
  // param, so the path segment proves which branch the proxy took. The v2 dashboard also lives
  // under /v2/, so "/deposit" must be matched first before checking for the version segment.
  @Step("Verify webview is on the v1 deposit flow")
  async verifyV1DepositFlowVisible() {
    const url = await waitForCurrentWebviewUrlToContain("/deposit");
    jestExpect(url).not.toContain("/v2/");
  }

  @Step("Verify webview is on the v2 deposit flow")
  async verifyV2DepositFlowVisible() {
    const url = await waitForCurrentWebviewUrlToContain("/deposit");
    jestExpect(url).toContain("/v2/");
  }

  @Step("Verify v1 deposit continue CTA is visible")
  async verifyV1DepositContinueCtaVisible() {
    await waitWebElementByTestId(this.ethAmountContinueCta);
  }

  @Step("Complete v2 ETH deposit amount step with $0 ETH")
  async completeV2EthDepositAmountStep(amount: string) {
    await waitWebElementByTestId(this.ethAmountInput);
    await typeTextByWebTestId(this.ethAmountInput, amount);
    await waitForWebElementToBeEnabled(this.v2AmountContinueCta);
    await tapWebElementByTestId(this.v2AmountContinueCta);
  }

  // v2 provider cards expand in place to reveal their own Deposit CTA, rather than selecting a
  // provider and confirming with a single shared button as v1 does.
  @Step("Expand v2 ETH provider card: $0")
  async expandV2EthProviderCard(providerId: string) {
    await waitWebElementByTestId(this.ethProviderPanel);
    await tapWebElementByTestId(this.ethProviderCardTestId(providerId));
  }

  @Step("Verify v2 ETH provider deposit CTA is visible: $0")
  async verifyV2EthProviderDepositCtaVisible(providerId: string) {
    await waitWebElementByTestId(
      this.ethProviderDepositCta(EarnV2DashboardPage.resolveEthProviderCardId(providerId)),
    );
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
