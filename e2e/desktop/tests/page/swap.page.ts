import { WebViewAppPage } from "./webViewApp.page";
import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { ChooseAssetDrawer } from "./drawer/choose.asset.drawer";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { Device } from "@ledgerhq/live-common/e2e/enum/Device";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { readFile } from "fs/promises";
import * as path from "path";
import { FileUtils } from "tests/utils/fileUtils";
import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";

// Uniswap's Permit2 "Approve token access" step can take 1-5 min to confirm on-chain
// before the sign-permit button appears (the app shows a "1-5 mins" estimate).
const APPROVAL_PROCESSING_TIMEOUT = 300_000;

export class SwapPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "swap";
  private static readonly EXPORT_SOURCE_PATH = path.resolve("./ledgerwallet-swap-history.csv");
  private static readonly EXPORT_ARTIFACT_PATH = path.resolve(
    __dirname,
    "../artifacts/ledgerwallet-swap-history.csv",
  );

  private swapPageHeading = this.page
    .getByTestId("page-header")
    .getByRole("heading", { name: "Swap" });

  // Swap Amount and Currency components
  private maxSpendableToggle = this.page.getByTestId("swap-max-spendable-toggle");
  private fromAccountCoinSelector = "from-account-coin-selector";
  private fromAccountAmountInput = "from-account-amount-input";
  private toAccountCoinSelector = "to-account-coin-selector";
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

    // Check if the swap is ETH <-> SOL pair (exclude LiFi for these pairs)
    const isEthSolPair =
      swap &&
      ((swap.accountToDebit.currency.id === Currency.ETH.id &&
        swap.accountToCredit.currency.id === Currency.SOL.id) ||
        (swap.accountToDebit.currency.id === Currency.SOL.id &&
          swap.accountToCredit.currency.id === Currency.ETH.id));

    const providersWithoutKYC = providersList.filter(providerName => {
      const provider = Object.values(SwapProvider).find(p => p.uiName === providerName);
      if (!provider || provider.kyc) {
        return false;
      }

      // Exclude LiFi for ETH <-> SOL pairs on all devices
      if (isEthSolPair && provider.name === SwapProvider.LIFI.name) {
        return false;
      }

      // Additional filter for LNS devices
      if (process.env.SPECULOS_DEVICE === Device.LNS.name) {
        return provider.availableOnLns;
      }

      return true;
    });

    for (const providerName of providersWithoutKYC) {
      const provider = Object.values(SwapProvider).find(p => p.uiName === providerName);
      if (provider && !provider.app) {
        const providerLocator = webview
          .locator(this.specificQuoteCardProviderName(provider.name))
          .first();

        await providerLocator.click();

        return provider;
      }
    }

    throw new Error(`No providers without KYC found: ${providersList.join(", ")}`);
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

  @step("Check currency to swap to contains $0")
  async checkAssetToContains(expected: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.toAccountCoinSelector)).toContainText(expected);
  }

  @step("Verify swap amount error message match: $0")
  async verifySwapAmountErrorMessageIsCorrect(message: string | RegExp) {
    const webview = await this.getWebView();
    const errorSpan = await webview.getByTestId("from-account-error").textContent();
    expect(errorSpan).toMatch(message);
  }

  @step("Check insufficient funds warning banner is visible")
  async checkInsufficientFundsBannerVisible() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.insufficientFundsWarning)).toBeVisible();
  }

  @step("verify quotes are displayed")
  async checkQuotes() {
    const webview = await this.getWebView();
    // Quotes are confirmed loaded once the best-offer info icon (rendered next
    // to the "Best Offer" title in the quotes list) is visible.
    await expect(webview.getByTestId(this.bestValueInfoIcon)).toBeVisible();
  }

  @step("Go and wait for Swap app to be ready")
  async goAndWaitForSwapToBeReady(swapFunction: () => Promise<void>) {
    // reset cached webview page to ensure we fetch the correct one after navigation
    this._webviewPage = undefined;

    // perform passed in action and wait for the swap page and webview
    await swapFunction();
    await this.swapPageHeading.waitFor({ state: "visible", timeout: 60_000 });
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
}
