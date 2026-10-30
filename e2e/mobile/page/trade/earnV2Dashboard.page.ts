import { Step } from "jest-allure2-reporter/api";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { byId } from "@e2e/helpers/elements/native";
import { waitForWebviewUrl, webById, webByXPath } from "@e2e/helpers/elements/web";

export default class EarnV2DashboardPage {
  // Webview locators (shared earn web app v2)
  private readonly footerDisclaimer = webById("footer-disclaimer");
  private readonly maxPotentialRewards = webById("max-potential-rewards");
  private readonly walletHeaderAmount = webById("wallet-header-amount");
  private readonly rewardsSummary = webById("rewards-summary");
  private readonly crowdFavourites = webById("crowd-favourites");
  private readonly simulateInvestmentCta = webById("simulate-investment-cta");
  private readonly earnSimulator = webById("earn-simulator");
  private readonly assetItemTicker = (ticker: string) => webById(`asset-item-ticker-${ticker}`);
  private readonly assetEarnCta = (ticker: string) => webById(`asset-earn-cta-${ticker}`);
  private readonly depositRow = (identifier: string) =>
    webByXPath(
      `//*[starts-with(@data-testid, "deposit-row-") and .//*[contains(text(), "${identifier}")]]`,
    );

  // Native locators
  private readonly stakingProvider = (providerId: string) =>
    byId(`staking-provider-${providerId}-title`);
  private readonly earnMenuOption = (label: string) =>
    byId(`earn-menu-option-${label.toLowerCase().replace(/\s+/g, "-")}`);
  private readonly stakingFlowStartButton = (ticker: string) => {
    const testId = EarnV2DashboardPage.stakingFlowTestIds[ticker];
    if (!testId) throw new Error(`No staking flow testID mapped for ticker "${ticker}"`);
    return byId(testId);
  };
  private static readonly stakingFlowTestIds: Record<string, string | RegExp> = {
    ATOM: /^(enabled-|disabled-)?cosmos-delegation-start-button$/,
    SOL: /^(enabled-|disabled-)?solana-delegation-start-button$/,
  };

  // --- Ice Cold Start ---

  @Step("Wait for and verify ice cold start page")
  async verifyIceColdStartPage() {
    await this.footerDisclaimer.waitVisible();
    await this.maxPotentialRewards.waitGone();
    await this.walletHeaderAmount.waitGone();
  }

  @Step("Click simulate investment CTA")
  async clickSimulateInvestmentCta() {
    await this.simulateInvestmentCta.tap();
  }

  @Step("Verify earn simulator is visible")
  async verifyEarnSimulatorVisible() {
    await this.earnSimulator.waitVisible();
  }

  // --- Cold Start ---

  @Step("Wait for cold start page to load")
  async waitForColdStartPage() {
    await this.maxPotentialRewards.waitVisible();
  }

  @Step("Verify cold start page")
  async verifyColdStartPage() {
    await this.crowdFavourites.waitVisible();
  }

  @Step("Verify asset ready to earn {{{0}}}")
  async verifyAssetReadyToEarn(ticker: string) {
    await this.assetItemTicker(ticker).waitVisible();
  }

  @Step("Click asset earn CTA {{{0}}}")
  async clickAssetEarnCta(ticker: string) {
    await this.assetEarnCta(ticker).tap();
  }

  // --- Hot Start ---

  @Step("Wait for hot start page to load")
  async waitForHotStartPage() {
    await this.walletHeaderAmount.waitVisible();
  }

  @Step("Verify rewards summary boxes")
  async verifyRewardsSummaryBoxes() {
    await this.rewardsSummary.waitVisible();
  }

  @Step("Verify position row present for {{{0}}}")
  async verifyPositionRowPresent(identifier: string) {
    await this.depositRow(identifier).waitVisible();
  }

  @Step("Click position row for {{{0}}}")
  async clickPositionRow(identifier: string) {
    await this.depositRow(identifier).tap();
  }

  // --- Webview Flow Verification (URL-based) ---

  @Step("Verify earn webview redirected to deposit flow")
  async verifyDepositFlowVisible() {
    const url = await waitForWebviewUrl("/deposit");
    jestExpect(url.toLowerCase()).not.toContain("/v2/");
  }

  @Step("Verify earn webview redirected to deposit v2 flow")
  async verifyV2DepositFlowVisible() {
    const url = await waitForWebviewUrl("/deposit");
    jestExpect(url.toLowerCase()).toMatch(/\/v2\/[^/]+\/deposit/);
  }

  @Step("Verify earn webview redirected to withdraw flow")
  async verifyWithdrawalFlowVisible() {
    await waitForWebviewUrl("/redeem");
  }

  // --- Staking Flow Verification (native) ---

  @Step("Verify staking flow opened for {{{0}}}")
  async verifyStakingFlowOpened(ticker: string) {
    await this.stakingFlowStartButton(ticker).waitVisible();
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

  private readonly ethAmountInput = webById("amount-input-section-input");
  private readonly ethAmountContinueCta = webById("input-button-mobile");
  private readonly ethProviderPanel = webById("eth-provider-panel");
  private readonly ethProviderAllFilterChip = webById("filter-chip-all");
  private readonly ethDepositProviderCta = webById("select-provider-button-mobile");
  // The provider card test id suffix is the backend `ID` enum value, which differs from the e2e
  // provider value, so map the providers we exercise.
  private static readonly ethProviderCardIds: Record<string, string> = {
    lido: "Lido",
    kiln_pooling: "KilnEthereumPooling",
    "stader-eth": "stader-eth",
  };
  private static readonly providerCardId = (providerId: string) =>
    EarnV2DashboardPage.ethProviderCardIds[providerId] ?? providerId;

  @Step("Complete ETH deposit amount step with {{{0}}} ETH")
  async completeEthDepositAmountStep(amount: string) {
    await this.ethAmountInput.replaceText(amount);
    await this.ethAmountContinueCta.waitEnabled();
    await this.ethAmountContinueCta.tap();
  }

  @Step("Select ETH provider {{{0}}} in deposit webview")
  async selectEthProviderInWebview(providerId: string) {
    await this.ethProviderPanel.waitVisible();
    // The ETH partner-dapp flags pin the deposit cohort to basic_sorting, so the category filter bar
    // always renders. Its default filter (protocol/liquid) hides providers in other categories (e.g.
    // Kiln is "pooling"), so reset to "All" to make any provider selectable. Tapping directly (no
    // presence guard) asserts the chip exists — a regression in the filter bar fails loudly.
    await this.ethProviderAllFilterChip.tap();
    await this.ethProviderCard(providerId).tap();
  }

  @Step("Confirm ETH deposit provider selection")
  async confirmEthDepositProvider() {
    await this.ethDepositProviderCta.waitEnabled();
    await this.ethDepositProviderCta.tap();
  }

  // --- ETH deposit v2 webview flow (swapToEarn enabled) ---

  private readonly accountSelectorInput = webById("account-selector-input");
  private readonly swapDescription = webById("amount-input-section-swap-description");
  private readonly amountPresets = webById("amount-presets");
  private readonly amountPreset = (preset: "25" | "50" | "75" | "max") =>
    webById(`amount-preset-${preset}`);
  private readonly customKeyboard = webById("custom-keyboard");
  private readonly customKeyboardKey = (key: string) => webById(`custom-keyboard-key-${key}`);
  private readonly amountContinueCta = webById("amount-continue-cta");
  private readonly ethProviderAllCategory = webById("category-filter-all");
  private readonly ethProviderCard = (providerId: string) =>
    webById(`eth-provider-card-${EarnV2DashboardPage.providerCardId(providerId)}`);
  // Expandable cards attach onClick to the header. The card root is not clickable.
  private readonly ethProviderHeader = (providerId: string) =>
    webById(`eth-provider-header-${EarnV2DashboardPage.providerCardId(providerId)}`);
  private readonly ethProviderDepositCta = (providerId: string) =>
    webById(`eth-provider-deposit-${EarnV2DashboardPage.providerCardId(providerId)}`);

  @Step("Verify deposit screen v2 amount step")
  async verifyV2DepositScreenVisible() {
    await this.accountSelectorInput.waitVisible();
    await this.amountPresets.waitVisible();
  }

  @Step("Enter deposit v2 amount {{{0}}} with the in-app keyboard")
  async enterDepositAmountWithKeyboardV2(amount: string) {
    await this.customKeyboard.waitVisible();
    for (const key of amount) {
      await this.customKeyboardKey(key).tap();
    }
    jestExpect(await this.ethAmountInput.getValue()).toBe(amount);
  }

  @Step("Select another funding account {{{0.accountName}}}")
  async selectAnotherFundingAccount(account: Account) {
    await this.accountSelectorInput.tap();
    await app.modularDrawer.selectAssetAndAccount(account);
  }

  @Step("Verify swap-to-earn copy from {{{0}}} to {{{1}}}")
  async verifySwapToEarnDescription(fromTicker: string, toTicker: string) {
    const text = await this.swapDescription.getText();
    jestExpect(text).toContain(fromTicker);
    jestExpect(text).toContain(toTicker);
  }

  @Step("Continue to swap")
  async continueToSwap() {
    await this.amountContinueCta.waitEnabled();
    const label = await this.amountContinueCta.getText();
    jestExpect(label).toContain("Go to swap");
    await this.amountContinueCta.tap();
    await app.swapLiveApp.expectSwapLiveAppForm();
  }

  @Step("Select deposit v2 amount preset {{{0}}}")
  async selectAmountPresetV2(preset: "25" | "50" | "75" | "max") {
    await this.amountPreset(preset).tap();
    // The preset amount depends on the live balance, so only require a positive number.
    const amount = Number(await this.ethAmountInput.getValue());
    jestExpect(amount).toBeGreaterThan(0);
  }

  @Step("Complete ETH deposit v2 amount step")
  async completeEthDepositAmountStepV2() {
    await this.amountContinueCta.waitEnabled();
    await this.amountContinueCta.tap();
  }

  @Step("Select ETH provider {{{0}}} in deposit v2 webview")
  async selectEthProviderV2(providerId: string) {
    await this.ethProviderPanel.waitVisible();
    // basic_sorting defaults to a category that can hide the target provider.
    await this.ethProviderAllCategory.tap();
    await this.ethProviderCard(providerId).waitVisible();
    await this.ethProviderHeader(providerId).tap();
  }

  @Step("Confirm ETH deposit v2 provider {{{0}}}")
  async confirmEthDepositProviderV2(providerId: string) {
    const depositCta = this.ethProviderDepositCta(providerId);
    await depositCta.waitEnabled();
    await depositCta.tap();
  }

  @Step("Tap staking provider in EvmStakingDrawer: {{{0}}}")
  async tapStakingProvider(providerId: string) {
    await this.stakingProvider(providerId).tap();
  }

  @Step("Verify partner dapp loaded (webview URL contains {{{0}}})")
  async verifyPartnerDappLoaded(urlSubstring: string) {
    const url = await waitForWebviewUrl(urlSubstring);
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
    for (const option of options) {
      await this.earnMenuOption(option).waitVisible();
    }
  }

  @Step("Tap manage drawer option {{{0}}}")
  async tapManageDrawerOption(optionText: string) {
    await this.earnMenuOption(optionText).tap();
  }
}
