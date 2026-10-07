import { Step } from "jest-allure2-reporter/api";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";

export default class EarnV2DashboardPage {
  // Webview locators (shared earn web app v2)
  footerDisclaimer = "footer-disclaimer";
  maxPotentialRewards = "max-potential-rewards";
  walletHeaderAmount = "wallet-header-amount";
  rewardsSummary = "rewards-summary";
  crowdFavourites = "crowd-favourites";
  simulateInvestmentCta = "simulate-investment-cta";
  earnSimulator = "earn-simulator";
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

  @Step("Click simulate investment CTA")
  async clickSimulateInvestmentCta() {
    await tapWebElementByTestId(this.simulateInvestmentCta);
  }

  @Step("Verify earn simulator is visible")
  async verifyEarnSimulatorVisible() {
    await waitWebElementByTestId(this.earnSimulator);
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

  @Step("Verify asset ready to earn {{{0}}}")
  async verifyAssetReadyToEarn(ticker: string) {
    await detoxExpect(getWebElementByTestId(this.assetItemTicker(ticker))).toExist();
  }

  @Step("Click asset earn CTA {{{0}}}")
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

  @Step("Verify position row present for {{{0}}}")
  async verifyPositionRowPresent(identifier: string) {
    await detoxExpect(getWebElementByXpath(this.depositRowXPath(identifier))).toExist();
  }

  @Step("Click position row for {{{0}}}")
  async clickPositionRow(identifier: string) {
    const row = getWebElementByXpath(this.depositRowXPath(identifier));
    await tapWebElementByElement(row);
  }

  // --- Webview Flow Verification (URL-based) ---

  @Step("Verify earn webview redirected to deposit flow")
  async verifyDepositFlowVisible() {
    const url = await waitForCurrentWebviewUrlToContain("/deposit");
    jestExpect(url.toLowerCase()).toContain("/deposit");
    jestExpect(url.toLowerCase()).not.toContain("/v2/");
  }

  @Step("Verify earn webview redirected to deposit v2 flow")
  async verifyV2DepositFlowVisible() {
    const url = await waitForCurrentWebviewUrlToContain("/deposit");
    jestExpect(url.toLowerCase()).toMatch(/\/v2\/[^/]+\/deposit/);
  }

  @Step("Verify earn webview redirected to withdraw flow")
  async verifyWithdrawalFlowVisible() {
    const url = await waitForCurrentWebviewUrlToContain("/redeem");
    jestExpect(url.toLowerCase()).toContain("/redeem");
  }

  // --- Staking Flow Verification (native) ---

  @Step("Verify staking flow opened for {{{0}}}")
  async verifyStakingFlowOpened(ticker: string) {
    const testId = EarnV2DashboardPage.stakingFlowTestIds[ticker];
    if (!testId) {
      throw new Error(`No staking flow testID mapped for ticker "${ticker}"`);
    }
    await detoxExpect(getElementById(testId)).toBeVisible();
  }

  @Step("Verify earn flow started for {{{0}}}")
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

  ethAmountInput = "amount-input-section-input";
  ethAmountContinueCta = "input-button-mobile";
  ethProviderPanel = "eth-provider-panel";
  ethProviderAllFilterChip = "filter-chip-all";
  ethDepositProviderCta = "select-provider-button-mobile";
  // The provider card test id suffix is the backend `ID` enum value, which differs from the e2e
  // provider value, so map the providers we exercise.
  private static readonly ethProviderCardIds: Record<string, string> = {
    lido: "Lido",
    kiln_pooling: "KilnEthereumPooling",
    "stader-eth": "stader-eth",
  };

  @Step("Complete ETH deposit amount step with {{{0}}} ETH")
  async completeEthDepositAmountStep(amount: string) {
    await waitWebElementByTestId(this.ethAmountInput);
    await typeTextByWebTestId(this.ethAmountInput, amount);
    await waitForWebElementToBeEnabled(this.ethAmountContinueCta);
    await tapWebElementByTestId(this.ethAmountContinueCta);
  }

  @Step("Select ETH provider {{{0}}} in deposit webview")
  async selectEthProviderInWebview(providerId: string) {
    await waitWebElementByTestId(this.ethProviderPanel);
    // The ETH partner-dapp flags pin the deposit cohort to basic_sorting, so the category filter bar
    // always renders. Its default filter (protocol/liquid) hides providers in other categories (e.g.
    // Kiln is "pooling"), so reset to "All" to make any provider selectable. Tapping directly (no
    // presence guard) asserts the chip exists — a regression in the filter bar fails loudly.
    await tapWebElementByTestId(this.ethProviderAllFilterChip);
    const cardId = EarnV2DashboardPage.ethProviderCardIds[providerId] ?? providerId;
    await tapWebElementByTestId(`eth-provider-card-${cardId}`);
  }

  @Step("Confirm ETH deposit provider selection")
  async confirmEthDepositProvider() {
    await waitForWebElementToBeEnabled(this.ethDepositProviderCta);
    await tapWebElementByTestId(this.ethDepositProviderCta);
  }

  // --- ETH deposit v2 webview flow (swapToEarn enabled) ---

  accountSelectorInput = "account-selector-input";
  swapDescription = "amount-input-section-swap-description";
  amountPresets = "amount-presets";
  amountPreset = (preset: "25" | "50" | "75" | "max") => `amount-preset-${preset}`;
  customKeyboard = "custom-keyboard";
  customKeyboardKey = (key: string) => `custom-keyboard-key-${key}`;
  amountContinueCta = "amount-continue-cta";
  ethProviderAllCategory = "category-filter-all";
  ethProviderCard = (providerId: string) =>
    `eth-provider-card-${EarnV2DashboardPage.ethProviderCardIds[providerId] ?? providerId}`;
  // Expandable cards attach onClick to the header. The card root is not clickable.
  ethProviderHeader = (providerId: string) =>
    `eth-provider-header-${EarnV2DashboardPage.ethProviderCardIds[providerId] ?? providerId}`;
  ethProviderDepositCta = (providerId: string) =>
    `eth-provider-deposit-${EarnV2DashboardPage.ethProviderCardIds[providerId] ?? providerId}`;

  @Step("Verify deposit screen v2 amount step")
  async verifyV2DepositScreenVisible() {
    await waitWebElementByTestId(this.accountSelectorInput);
    await waitWebElementByTestId(this.amountPresets);
  }

  @Step("Enter deposit v2 amount {{{0}}} with the in-app keyboard")
  async enterDepositAmountWithKeyboardV2(amount: string) {
    await waitWebElementByTestId(this.customKeyboard);
    for (const key of amount) {
      await tapWebElementByTestId(this.customKeyboardKey(key));
    }
    jestExpect(await getValueByWebTestId(this.ethAmountInput)).toBe(amount);
  }

  @Step("Select another funding account {{{0.accountName}}}")
  async selectAnotherFundingAccount(account: Account) {
    await tapWebElementByTestId(this.accountSelectorInput);
    await app.modularDrawer.selectAssetAndAccount(account);
  }

  @Step("Verify swap-to-earn copy from {{{0}}} to {{{1}}}")
  async verifySwapToEarnDescription(fromTicker: string, toTicker: string) {
    await waitWebElementByTestId(this.swapDescription);
    const text = await getWebElementText(this.swapDescription);
    jestExpect(text).toContain(fromTicker);
    jestExpect(text).toContain(toTicker);
  }

  @Step("Continue to swap")
  async continueToSwap() {
    await waitForWebElementToBeEnabled(this.amountContinueCta);
    const label = await getWebElementText(this.amountContinueCta);
    jestExpect(label).toContain("Go to swap");
    await tapWebElementByTestId(this.amountContinueCta);
    await app.swapLiveApp.expectSwapLiveAppForm();
  }

  @Step("Select deposit v2 amount preset {{{0}}}")
  async selectAmountPresetV2(preset: "25" | "50" | "75" | "max") {
    await tapWebElementByTestId(this.amountPreset(preset));
    // The preset value depends on the live balance, so only check that it filled the input.
    const value = await getValueByWebTestId(this.ethAmountInput);
    jestExpect(value).not.toMatch(/^0?$/);
  }

  @Step("Complete ETH deposit v2 amount step")
  async completeEthDepositAmountStepV2() {
    await waitForWebElementToBeEnabled(this.amountContinueCta);
    await tapWebElementByTestId(this.amountContinueCta);
  }

  @Step("Select ETH provider {{{0}}} in deposit v2 webview")
  async selectEthProviderV2(providerId: string) {
    await waitWebElementByTestId(this.ethProviderPanel);
    // basic_sorting defaults to a category that can hide the target provider.
    await tapWebElementByTestId(this.ethProviderAllCategory);
    await waitWebElementByTestId(this.ethProviderCard(providerId));
    await tapWebElementByTestId(this.ethProviderHeader(providerId));
  }

  @Step("Confirm ETH deposit v2 provider {{{0}}}")
  async confirmEthDepositProviderV2(providerId: string) {
    await waitForWebElementToBeEnabled(this.ethProviderDepositCta(providerId));
    await tapWebElementByTestId(this.ethProviderDepositCta(providerId));
  }

  @Step("Tap staking provider in EvmStakingDrawer: {{{0}}}")
  async tapStakingProvider(providerId: string) {
    await tapById(this.stakingProvider(providerId));
  }

  @Step("Verify partner dapp loaded (webview URL contains {{{0}}})")
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

  @Step("Wait for manage drawer and verify options present: {{{0}}}")
  async waitForManageDrawerAndVerifyOptions(options: string[]) {
    await waitForElementById(this.earnMenuOption(options[0]));
    for (const option of options) {
      await detoxExpect(getElementById(this.earnMenuOption(option))).toExist();
    }
  }

  @Step("Tap manage drawer option {{{0}}}")
  async tapManageDrawerOption(optionText: string) {
    await tapById(this.earnMenuOption(optionText));
  }
}
