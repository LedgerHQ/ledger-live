import { WebViewAppPage } from "./webViewApp.page";
import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { ChooseAssetDrawer } from "./drawer/choose.asset.drawer";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { Device } from "@ledgerhq/live-e2e-shared/enum/Device";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { readFile } from "fs/promises";
import * as path from "path";
import { FileUtils } from "tests/utils/fileUtils";
import { getMinimumSwapAmount } from "@ledgerhq/live-e2e-shared/swap";
import { expectAmountCloseTo } from "tests/utils/amountUtils";

// Uniswap's Permit2 "Approve token access" step can take 1-5 min to confirm on-chain
// before the sign-permit button appears (the app shows a "1-5 mins" estimate).
const APPROVAL_PROCESSING_TIMEOUT = 300_000;
type SwapSurface = "full" | "embedded";

type PercentageKey = "25%" | "50%" | "75%";

export class SwapPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "swap";
  private static readonly EXPORT_SOURCE_PATH = path.resolve("./ledgerwallet-swap-history.csv");
  private static readonly EXPORT_ARTIFACT_PATH = path.resolve(
    __dirname,
    "../artifacts/ledgerwallet-swap-history.csv",
  );

  private readonly fullSwapContainer = this.page.getByTestId("swap-web-app-container-full");
  private readonly embeddedSwapContainer = this.page.getByTestId("swap-web-app-container-embedded");

  // Swap Amount and Currency components
  private maxSpendableToggle = this.page.getByTestId("swap-max-spendable-toggle");
  private fromAccountCoinSelector = "from-account-coin-selector";
  private fromAccountAmountInput = "from-account-amount-input";
  private readonly fromAccountError = "from-account-error";
  private readonly noQuotesPlaceholder = "quotes-error-state";
  private toAccountCoinSelector = "to-account-coin-selector";
  private readonly toAccountAccountNameTag = "to-account-account-name-tag";
  private quoteCardProviderName = "compact-quote-card-provider-";
  private specificQuoteCardProviderName = (provider: string) =>
    `[data-testid^='compact-quote-card-provider-name-${provider.toLowerCase()}']`;
  private providerContainerSelector = (provider: string) =>
    `[data-testid^="quote-container-${provider}"]`;
  private providerContainerInfoSelector = (provider: string, suffix: string) =>
    `${this.providerContainerSelector(provider)}[data-testid$="${suffix}"]`;
  private bestValueInfoIcon = "best-value-info-icon";
  private switchButton = "to-account-switch-accounts";
  private swapMaxToggle = "from-account-max-toggle";
  private readonly fromAccountWrapper = "from-account-wrapper";
  private readonly fromAccountBalance = "from-account-balance";
  private readonly percentageButtonTestId = (key: PercentageKey) =>
    `from-account-percentage-${key}`;
  private readonly openTooltipSelector =
    '[data-slot="tooltip-content"]:not([data-state="closed"]) [role="tooltip"]';
  private quotesCountdown = "quotes-countdown";
  private networkFeesInfoIcon = "quoteCardTestId-networkFees-infoIcon";
  private rateInfoIcon = "QuoteCard-rate-infoIcon";
  private swapBtn = "execute-button";
  private executeSwapBtn = "execute-swap-button-step-approval";
  private continueBtn = this.page.locator("#sign-summary-continue-button");
  private insufficientFundsBuyButton = "insufficient-funds-buy-button";
  private insufficientFundsWarning = "insufficient-funds-warning";
  private executeButtonDisabled = "execute-button-disabled";
  // Swap Steps Approval components
  private readonly giveApprovalButton = "give-approval-button";
  private readonly signPermitButton = "sign-permit-button";
  private readonly revokeApprovalButton = "revoke-approval-button";

  // History Components
  readonly historyButton = this.page.getByTestId("History-tab-button");
  private operationRows = this.page.locator("[data-testid^='operation-row-']");
  private exportOperationsButton = this.page.getByTestId("export-swap-operations-link");
  private selectSpecificOperation = (swapId: string) =>
    this.page.getByTestId(`operation-row-${swapId}`);
  private selectSpecificOperationProvider = (swapId: string) =>
    this.page.getByTestId(`swap-history-provider-${swapId}`);
  private selectSpecificOperationDate = (swapId: string) =>
    this.page.getByTestId(`swap-history-date-${swapId}`);
  private selectSpecificOperationAccountFrom = (swapId: string) =>
    this.page.getByTestId(`swap-history-from-account-${swapId}`);
  private selectSpecificOperationAccountTo = (swapId: string) =>
    this.page.getByTestId(`swap-history-to-account-${swapId}`);
  private selectSpecificOperationAmountFrom = (swapId: string) =>
    this.page.getByTestId(`swap-history-from-amount-${swapId}`);
  private selectSpecificOperationAmountTo = (swapId: string) =>
    this.page.getByTestId(`swap-history-to-amount-${swapId}`);
  private chooseAssetDrawer = new ChooseAssetDrawer(this.page);

  async sendMax() {
    await this.maxSpendableToggle.click();
  }

  @step("Get provider list")
  async getProviderList() {
    const webview = await this.getWebView();
    // Quotes are confirmed loaded once the best-offer info icon (rendered next
    // to the "Best Offer" title in the quotes list) is visible.
    await expect(webview.getByTestId(this.bestValueInfoIcon)).toBeVisible();
    await expect(webview.getByTestId(this.quotesCountdown)).toBeVisible();

    return await webview
      .locator(`[data-testid^='${this.quoteCardProviderName}']`)
      .allTextContents();
  }

  @step("Check elements presence on swap approval step")
  async checkElementsPresenceOnSwapApprovalStep() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.quotesCountdown)).toBeVisible();
    await expect(webview.getByTestId(this.networkFeesInfoIcon)).toBeVisible();
    await expect(webview.getByTestId(this.rateInfoIcon)).toBeVisible();
  }

  @step("Click Continue button")
  async clickContinueButton() {
    await this.continueBtn.click();
  }

  @step("Check quotes container infos")
  async checkQuotesContainerInfos(providerList: string[], ticker: string) {
    const webview = await this.getWebView();
    const provider = SwapProvider.getNameByUiName(providerList[0]);

    await webview
      .locator(this.providerContainerInfoSelector(provider, "amount-label"))
      .first()
      .click();
    await expect(
      webview.locator(this.providerContainerInfoSelector(provider, "amount-label")),
    ).toBeVisible();
    await expect(
      webview.locator(this.providerContainerInfoSelector(provider, "fiatAmount-label")),
    ).toBeVisible();
    await expect(
      webview.locator(this.providerContainerInfoSelector(provider, "networkFees-heading")),
    ).toBeVisible();
    await expect(
      webview
        .locator(this.providerContainerInfoSelector(provider, "extraFeesContainer"))
        .getByText(/Floating rate|Fixed rate/),
    ).toBeVisible();
    await expect(
      webview.locator(this.providerContainerInfoSelector(provider, "rate-infoIcon")),
    ).toBeVisible();
    await expect(
      webview
        .locator(this.providerContainerInfoSelector(provider, "extraFeesContainer"))
        .getByText(ticker),
    ).toBeVisible();
    if (
      provider === SwapProvider.ONE_INCH.name ||
      provider === SwapProvider.VELORA.name ||
      provider === SwapProvider.UNISWAP.name ||
      provider === SwapProvider.LIFI.name
    ) {
      await expect(
        webview
          .locator(this.providerContainerInfoSelector(provider, "extraFeesContainer"))
          .getByText("Max Slippage"),
      ).toBeVisible();
      await expect(
        webview
          .locator(this.providerContainerInfoSelector(provider, "extraFeesContainer"))
          .getByText("%"),
      ).toBeVisible();
    }
    await this.checkExchangeButton(providerList[0]);
  }

  @step("Select specific provider")
  async selectSpecificProvider(provider: SwapProvider) {
    const webview = await this.getWebView();

    const providersList = await this.getProviderList();

    if (providersList.includes(provider.uiName)) {
      const providerLocator = webview
        .locator(this.specificQuoteCardProviderName(provider.name))
        .first();

      await providerLocator.click();
    } else {
      throw new Error("No valid providers found");
    }
  }

  @step("Select available provider without KYC")
  async selectExchangeWithoutKyc(swap?: Swap) {
    const webview = await this.getWebView();
    const providersList = await this.getProviderList();
    const isLns = process.env.SPECULOS_DEVICE === Device.LNS.name;
    const isEthSolPair =
      !!swap &&
      ((swap.accountToDebit.currency.id === Currency.ETH.id &&
        swap.accountToCredit.currency.id === Currency.SOL.id) ||
        (swap.accountToDebit.currency.id === Currency.SOL.id &&
          swap.accountToCredit.currency.id === Currency.ETH.id));

    const provider = providersList
      .map(uiName => SwapProvider.getByUiName(uiName))
      .find(
        providerEntry =>
          !!providerEntry &&
          !providerEntry.kyc &&
          !providerEntry.app &&
          !(isEthSolPair && providerEntry.name === SwapProvider.LIFI.name) &&
          (!isLns || providerEntry.availableOnLns),
      );

    if (!provider) {
      throw new Error(`No providers without KYC found: ${providersList.join(", ")}`);
    }

    await webview.locator(this.specificQuoteCardProviderName(provider.name)).first().click();
    return provider;
  }

  @step("Select available provider")
  async selectExchange() {
    const webview = await this.getWebView();

    const providersList = await this.getProviderList();

    const providers = providersList
      .map(providerName => ({
        providerName,
        provider: Object.values(SwapProvider).find(p => p.uiName === providerName),
      }))
      .filter(
        (entry): entry is { providerName: string; provider: SwapProvider } =>
          entry.provider !== undefined,
      );

    for (const { providerName, provider } of providers) {
      const providerLocator = webview
        .locator(this.specificQuoteCardProviderName(provider.name))
        .first();

      if (await providerLocator.isVisible()) {
        await providerLocator.click();
        return providerName;
      }
    }
    throw new Error("No valid providers found");
  }

  @step("Get all swap providers available")
  async getAllSwapProviders() {
    const webview = await this.getWebView();
    return await webview
      .locator(
        '[data-testid^="quote-container-"][data-testid$="-fixed"], [data-testid^="quote-container-"][data-testid$="-float"]',
      )
      .allTextContents();
  }

  @step("Check drawer error message ($0)")
  async checkFeeErrorMessage(errorMessage: string | RegExp) {
    const webview = await this.getWebView();

    const insufficientFundsWarningElem = webview.getByTestId(this.insufficientFundsWarning);
    const errorMessageSpan = insufficientFundsWarningElem.getByText(errorMessage);
    await expect(errorMessageSpan).toBeVisible();
    const insufficientFundsBuyButton = webview.getByTestId(this.insufficientFundsBuyButton);
    await expect(insufficientFundsBuyButton).toBeEnabled();
    // Each quote card renders its own disabled CTA when the swap is
    // blocked; assert on the first match instead of a unique element.
    await expect(webview.getByTestId(this.executeButtonDisabled).first()).toBeDisabled();
  }

  @step("Extract quotes and fees")
  async extractQuotesAndFees(quoteContainers: string[]) {
    const quotes = quoteContainers
      .map(quote => {
        const match = quote.match(/Network Fees \$(\d+(?:\.\d+)?).*?[A-Z]{2,10}\$(\d+\.\d+)/);
        if (match) {
          const fees = parseFloat(match[1]);
          const rate = parseFloat(match[2]);
          return { rate, fees, quote };
        }
        return undefined;
      })
      .filter(quote => quote !== undefined);

    if (quotes.length === 0) {
      throw new Error("No quotes found");
    }
    return quotes;
  }

  @step('Check "Best Offer" corresponds to the best quote')
  async checkBestOffer() {
    const quoteContainers = await this.getAllSwapProviders();
    const quotes = await this.extractQuotesAndFees(quoteContainers);
    const bestOffer = quotes.reduce<{ rate: number; fees: number; quote: string } | null>(
      (max, current) =>
        current && (!max || current.rate - current.fees > max.rate - max.fees) ? current : max,
      null,
    );
    expect(bestOffer?.quote).toMatch(quoteContainers[0]);
  }

  @step("Check exchange button is visible and enabled")
  async checkExchangeButton(provider: string) {
    const webview = await this.getWebView();

    const buttonLocator = webview.getByRole("button", { name: new RegExp(provider, "i") });
    await expect(buttonLocator).toBeVisible();
    await expect(buttonLocator).toBeEnabled();
  }

  @step("Click Exchange button")
  async clickExchangeButton(provider: string) {
    const webview = await this.getWebView();
    await webview
      .locator(this.providerContainerSelector(provider))
      .getByTestId(this.swapBtn)
      // 'first' as workaround for changely showing float AND fixed in the list
      .first()
      .click();
  }

  @step("Click Execute Swap button")
  async clickExecuteSwapButton() {
    const webview = await this.getWebView();
    const executeSwapButton = webview.getByTestId(this.executeSwapBtn);
    await expect(executeSwapButton).toBeVisible();
    await expect(executeSwapButton).toBeEnabled();
    await executeSwapButton.waitFor({ state: "attached" });
    await executeSwapButton.evaluate((btn: HTMLElement) => {
      return new Promise<void>(resolve => {
        const interval = setInterval(() => {
          if (!btn.hasAttribute("disabled")) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    });
    await executeSwapButton.click();
  }

  @step("Retrieve send currency amount value")
  async getAmountToSend() {
    const webview = await this.getWebView();
    return await webview.getByTestId(this.fromAccountAmountInput).inputValue();
  }

  @step("Click switch button")
  async switchYouSendAndYouReceive() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.switchButton).click();
  }

  @step("Check currency to swap from contains $0")
  async checkAssetFromContains(expected: string) {
    this._webviewPage = undefined;
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.fromAccountCoinSelector)).toContainText(expected);
  }

  @step("Expect asset or account selected $0 to be displayed")
  async expectSelectedAssetDisplayed(asset: string | RegExp) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.fromAccountCoinSelector)).toContainText(asset);
  }

  @step("Check if $0 asset is already selected")
  async checkIfFromAssetIsAlreadySelected(asset: string): Promise<boolean> {
    const webview = await this.getWebView();
    const selector = webview.getByTestId(this.fromAccountCoinSelector);

    try {
      await webview.waitForFunction(
        selectorTestId => {
          const el = document.querySelector(`[data-testid='${selectorTestId}']`);
          return el && el.textContent && el.textContent !== "Choose asset";
        },
        this.fromAccountCoinSelector,
        { timeout: 5_000 },
      );
    } catch {
      // Page context closed or from-selector not yet pre-populated; caller will proceed to manual selection
      return false;
    }

    const text = await selector.textContent();
    return text?.includes(asset) ?? false;
  }

  @step("Check if $0 asset is already selected")
  async checkIfToAssetIsAlreadySelected(asset: string): Promise<boolean> {
    const webview = await this.getWebView();
    const selector = webview.getByTestId(this.toAccountCoinSelector);

    try {
      await webview.waitForFunction(
        selectorTestId => {
          const el = document.querySelector(`[data-testid='${selectorTestId}']`);
          return el && el.textContent && el.textContent !== "Choose asset";
        },
        this.toAccountCoinSelector,
        { timeout: 5_000 },
      );
    } catch {
      // to-selector was not pre-populated; caller will proceed to manual selection
      return false;
    }

    const text = await selector.textContent();
    return text?.includes(asset) ?? false;
  }

  @step("Fill in amount: $0")
  async fillInOriginCurrencyAmount(amount: string) {
    const webview = await this.getWebView();

    const amountInput = webview.getByTestId(this.fromAccountAmountInput);

    // Wait for input to be fully interactive after dialog closes
    await expect(amountInput).toBeVisible();
    await expect(amountInput).toBeEnabled();

    // Click to focus the input before filling
    await amountInput.click();
    await amountInput.fill(amount);

    //wait for potential origin amount error to be loaded
    await this.page.waitForTimeout(500);
  }

  @step("Select currency to swap to: $0")
  async selectAssetTo(currency: string) {
    const webview = await this.getWebView();
    await webview.getByTestId(this.toAccountCoinSelector).click();
    await this.chooseAssetDrawer.chooseFromAsset(currency);
  }

  @step("Select currency to swap from: $0")
  async selectAssetFrom(currency: string) {
    const webview = await this.getWebView();
    await webview.getByTestId(this.fromAccountCoinSelector).click();
    await this.chooseAssetDrawer.chooseFromAsset(currency);
  }

  @step("Choose from asset $0")
  async selectAsset(currency: string, networkName?: string) {
    await this.chooseAssetDrawer.chooseFromAsset(currency, networkName);
  }

  @step("Select to account coin selector")
  async selectToAccountCoinSelector() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.toAccountCoinSelector).click();
  }

  @step("Select from account coin selector")
  async selectFromAccountCoinSelector() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.fromAccountCoinSelector).click();
  }

  @step("Wait for the to-account coin selector to be populated")
  async waitForToAssetSelectorReady() {
    const webview = await this.getWebView();
    await webview.waitForFunction(
      selectorTestId => {
        const el = document.querySelector(`[data-testid='${selectorTestId}']`);
        return Boolean(el?.textContent && el.textContent.trim() !== "Choose asset");
      },
      this.toAccountCoinSelector,
      { timeout: 5_000 },
    );
  }

  @step("Check currency to swap to contains $0")
  async checkAssetToContains(expected: string) {
    await this.waitForToAssetSelectorReady();
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.toAccountCoinSelector)).toContainText(expected);
  }

  @step("Check currency to swap to account name contains $0")
  async checkAssetToAccountNameContains(expected: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.toAccountAccountNameTag)).toContainText(expected);
  }

  @step("Verify swap error message match: $0 ($1)")
  async verifySwapErrorMessageIsCorrect(
    message: string | RegExp,
    display: "banner" | "quotesPlaceholder",
  ) {
    const webview = await this.getWebView();
    const testId =
      display === "quotesPlaceholder" ? this.noQuotesPlaceholder : this.fromAccountError;
    await expect(webview.getByTestId(testId)).toContainText(message);
  }

  @step("Verify swap cross account error message match: $0")
  async verifySwapCrossAccountErrorMessageIsCorrect(message: string | RegExp) {
    const webview = await this.getWebView();
    // Auto-retrying locator assertion: waits for the cross-account warning to render before matching.
    await expect(webview.getByTestId(this.fromAccountError)).toContainText(message);
  }

  @step("verify quotes are displayed")
  async checkQuotes() {
    const webview = await this.getWebView();
    // Quotes are confirmed loaded once the best-offer info icon (rendered next
    // to the "Best Offer" title in the quotes list) is visible.
    await expect(webview.getByTestId(this.bestValueInfoIcon)).toBeVisible();
  }

  @step("Go and wait for Swap app to be ready")
  async goAndWaitForSwapToBeReady(
    swapFunction: () => Promise<void>,
    surface: SwapSurface = "full",
  ) {
    // reset cached webview page to ensure we fetch the correct one after navigation
    this._webviewPage = undefined;

    await swapFunction();
    const swapContainer =
      surface === "embedded" ? this.embeddedSwapContainer : this.fullSwapContainer;
    await swapContainer.waitFor();
    await this.getWebView();
  }

  @step("Go to swap history")
  async goToSwapHistory() {
    await this.historyButton.click();
  }

  @step("Check swap operation row details")
  async checkSwapOperation(swapId: string, provider: SwapProvider, swap: Swap) {
    await expect(this.operationRows).toBeVisible();
    await expect(this.selectSpecificOperation(swapId)).toBeVisible();
    await expect(this.selectSpecificOperationProvider(swapId)).toContainText(provider.uiName);
    await expect(this.selectSpecificOperationDate(swapId)).toBeVisible();
    await expect(this.selectSpecificOperationAccountFrom(swapId)).toContainText(
      swap.accountToDebit.accountName,
    );
    await expect(this.selectSpecificOperationAccountTo(swapId)).toContainText(
      swap.accountToCredit.accountName,
    );
    await expect(this.selectSpecificOperationAmountFrom(swapId)).toContainText(swap.amount);
    await expect(this.selectSpecificOperationAmountTo(swapId)).toBeVisible();
  }

  @step("Open selected operation by swapId: $0")
  async openSelectedOperation(swapId: string) {
    await this.selectSpecificOperation(swapId).click();
  }

  @step("Click on export operations")
  async clickExportOperations() {
    await expect(this.operationRows.first()).toBeVisible();
    await this.exportOperationsButton.click();

    await FileUtils.waitForFileAndMove(SwapPage.EXPORT_SOURCE_PATH, SwapPage.EXPORT_ARTIFACT_PATH);
  }

  @step("Check contents of exported operations file")
  async checkExportedFileContents(swap: Swap, provider: SwapProvider, id: string) {
    const fileContents = await readFile(SwapPage.EXPORT_ARTIFACT_PATH, "utf-8");

    expect(fileContents).toContain(provider.name);
    expect(fileContents).toContain(id);
    expect(fileContents).toContain(swap.accountToDebit.currency.ticker);
    expect(fileContents).toContain(swap.accountToCredit.currency.ticker);
    expect(fileContents).toContain(swap.amount);
    expect(fileContents).toContain(swap.accountToDebit.accountName);
    expect(fileContents).toContain(swap.accountToDebit.address);
    expect(fileContents).toContain(swap.accountToCredit.accountName);
    expect(fileContents).toContain(swap.accountToCredit.address);
  }

  async getMinimumAmount(accountFrom: Account, accountTo: Account) {
    const amount = await getMinimumSwapAmount(accountFrom, accountTo);
    return amount ? Number.parseFloat(amount.toFixed(6)).toString() : "";
  }

  @step("Click on swap max")
  async clickSwapMax() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.swapMaxToggle).click();
  }

  @step("Get from-account balance text")
  async getFromAccountBalanceText() {
    const webview = await this.getWebView();
    return await webview.getByTestId(this.fromAccountBalance).textContent();
  }

  @step("Hover from-account amount field to reveal quick-fill buttons")
  async hoverAmountField() {
    const webview = await this.getWebView();
    const wrapper = webview.getByTestId(this.fromAccountWrapper);
    const anyPercentageButton = webview.getByTestId(this.percentageButtonTestId("25%"));
    // hover() on the wrapper can occasionally fail to stick the CSS :hover
    // state (seen with Electron's out-of-process webview), leaving the
    // group-hover-revealed row invisible; re-hovering until it's confirmed
    // revealed is more reliable than waiting longer on a single attempt.
    await expect(async () => {
      await wrapper.hover();
      await expect(anyPercentageButton).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
  }

  // Max/% are Lumen `Tag` components rendered as plain <div>s: `disabled` only
  // drives styling (never a real disabled/aria-disabled attribute), so
  // enabled state must be read from the `cursor-not-allowed` class.
  private async isEnabledByCursorClass(testId: string) {
    const webview = await this.getWebView();
    const classAttr = await webview.getByTestId(testId).getAttribute("class");
    return classAttr !== null && !classAttr.includes("cursor-not-allowed");
  }

  // Hovers a trigger and asserts the tooltip text. Radix keeps a just-left
  // trigger's tooltip open (data-state !== "closed") until the newly-hovered
  // trigger's tooltip finishes its open delay, so "read whichever tooltip is
  // open" returns the stale one when moving between the 25/50/75 buttons.
  // Polling allTextContents (which never throws strict-mode on multiple matches)
  // until the expected text appears waits that transition out. openTooltipSelector
  // scopes to the visually-hidden [role="tooltip"] node(s) that mirror the content,
  // so the text comes back once (the visible wrapper's own textContent would be doubled).
  private async checkTooltipText(hoverTrigger: () => Promise<void>, expected: string) {
    const webview = await this.getWebView();
    await hoverTrigger();
    const tooltips = webview.locator(this.openTooltipSelector);
    await expect
      .poll(async () => (await tooltips.allTextContents()).map(text => text.trim()), {
        timeout: 15_000,
      })
      .toContain(expected);
  }

  @step("Check if Max button is enabled")
  async isMaxToggleEnabled() {
    return this.isEnabledByCursorClass(this.swapMaxToggle);
  }

  @step("Check Max button tooltip text: $0")
  async checkMaxTooltip(expected: string) {
    const webview = await this.getWebView();
    await this.checkTooltipText(() => webview.getByTestId(this.swapMaxToggle).hover(), expected);
  }

  @step("Check percentage button $0 tooltip text: $1")
  async checkPercentageTooltip(key: PercentageKey, expected: string) {
    const webview = await this.getWebView();
    await this.checkTooltipText(async () => {
      await this.hoverAmountField();
      await webview.getByTestId(this.percentageButtonTestId(key)).hover();
    }, expected);
  }

  @step("Click quick percentage button: $0")
  async clickPercentage(key: PercentageKey) {
    const webview = await this.getWebView();
    await this.hoverAmountField();
    await webview.getByTestId(this.percentageButtonTestId(key)).click();
  }

  @step("Check if quick percentage button $0 is enabled")
  async isPercentageEnabled(key: PercentageKey) {
    await this.hoverAmountField();
    return this.isEnabledByCursorClass(this.percentageButtonTestId(key));
  }

  @step("Check percentage buttons enabled: $0")
  async checkPercentageButtonsEnabled(expected: boolean) {
    await this.hoverAmountField();
    for (const key of ["25%", "50%", "75%"] as const) {
      expect(await this.isEnabledByCursorClass(this.percentageButtonTestId(key))).toBe(expected);
    }
  }

  @step("Check percentage button $0 fills the correct amount")
  async checkPercentageFillsBalance(key: PercentageKey, balance: number) {
    await this.clickPercentage(key);
    const amountToSend = Number(await this.getAmountToSend());
    const expectedAmount = (balance * parseFloat(key)) / 100;
    expectAmountCloseTo(amountToSend, expectedAmount);
  }

  @step("Expect reset allowance screen to be displayed")
  async expectResetApprovalScreen() {
    await this.verifyElementIsVisible(this.revokeApprovalButton);
  }

  @step("Click Revoke Approval button")
  async clickRevokeApprovalButton() {
    const webview = await this.getWebView();
    const revokeButton = webview.getByTestId(this.revokeApprovalButton);
    await revokeButton.click();
  }

  @step("Expect TwoStepApproval screen to be displayed")
  async expectTwoStepApprovalScreen() {
    await this.verifyElementIsVisible(this.giveApprovalButton);
  }

  @step("Click Give Approval button")
  async clickGiveApprovalButton() {
    const webview = await this.getWebView();
    const approvalButton = webview.getByTestId(this.giveApprovalButton);
    await approvalButton.click();
  }

  @step("Expect TwoStepSign screen to be displayed")
  async expectTwoStepSignScreen() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.executeSwapBtn)).toBeVisible({
      timeout: APPROVAL_PROCESSING_TIMEOUT,
    });
  }

  @step("Click Give Authorization button")
  async clickGiveAuthorizationButton() {
    const webview = await this.getWebView();
    const authorizationButton = webview.getByTestId(this.signPermitButton);
    await expect(authorizationButton).toBeVisible({ timeout: APPROVAL_PROCESSING_TIMEOUT });
    await authorizationButton.click();
  }

  @step("Selected provider: $0")
  async logSelectedProvider(providerName: string) {
    expect(providerName).toBeDefined();
  }

  @step("Check swap widget balance is masked in discreet mode for $0")
  async checkWidgetBalanceIsDiscreet(ticker: string) {
    const webview = await this.getWebView();
    const text = webview.getByTestId(this.fromAccountBalance);
    await expect(text).toContainText(new RegExp(`\\*\\*\\*\\s+${ticker}`, "i"));
  }
}
