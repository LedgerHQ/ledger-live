import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { floatNumberRegex } from "@ledgerhq/live-common/e2e/data/regexes";
import { WebViewHelper } from "../runtime/webView";

export type CurrencyField = "from" | "to";

// Minimum seconds left on the live quote before executing, so the swap tx is
// built and reaches the device before the quote expires (otherwise the device
// never receives the transaction). The quote counts down from ~20s.
const MIN_QUOTE_SECONDS_FOR_EXECUTE = 12;
const QUOTE_COUNTDOWN_MIN_SECONDS = 2;
const QUOTE_COUNTDOWN_MAX_SECONDS = 19;

export class SwapLiveAppPage {
  private readonly coinSelector: Record<CurrencyField, string> = {
    from: "from-account-coin-selector",
    to: "to-account-coin-selector",
  };
  private readonly fromAmountInput = "from-account-amount-input";
  private readonly toAmountInput = "to-account-amount-input";
  private readonly getQuotesButton = "mobile-get-quotes-button";
  private readonly getQuotesButtonDisabled = "mobile-get-quotes-button-disabled";
  private readonly numberOfQuotes = "number-of-quotes";
  private readonly quotesCountdown = "quotes-countdown";
  private readonly quoteCardProviderSelector = "[data-testid^='compact-quote-card-provider-']";
  private readonly executeSwapButton = "execute-button";

  private providerExecuteButtonSelector(providerUiName: string): string {
    const providerName = Provider.getNameByUiName(providerUiName);
    return `[data-testid^="quote-container-${providerName}"] [data-testid="${this.executeSwapButton}"]`;
  }

  constructor(private readonly webView: WebViewHelper) {}

  async expectSwapLiveApp(): Promise<void> {
    await this.webView.waitForTestId(this.coinSelector.from);
    await this.webView.waitForTestId(this.coinSelector.to);
    await this.webView.waitForTestId(this.getQuotesButtonDisabled);
  }

  getCurrencyText(field: CurrencyField): Promise<string> {
    return this.webView.getText(this.coinSelector[field]);
  }

  tapCurrency(field: CurrencyField): Promise<void> {
    return this.webView.tapByTestId(this.coinSelector[field]);
  }

  waitForCurrency(field: CurrencyField, ticker: string): Promise<void> {
    return this.webView.waitForTestIdText(this.coinSelector[field], ticker);
  }

  inputAmount(amount: string): Promise<void> {
    return this.webView.typeText(this.fromAmountInput, amount);
  }

  waitForReceiveAmountEstimate(): Promise<string> {
    return this.webView.waitForSelectorMatches(
      `[data-testid="${this.toAmountInput}"]`,
      floatNumberRegex.source,
    );
  }

  tapGetQuotes(): Promise<void> {
    return this.webView.tapByTestIdWhenEnabled(this.getQuotesButton);
  }

  async waitForQuotes(): Promise<void> {
    await this.webView.waitForTestId(this.numberOfQuotes);
    await this.webView.waitForTestIdNumberInRange(
      this.quotesCountdown,
      QUOTE_COUNTDOWN_MIN_SECONDS,
      QUOTE_COUNTDOWN_MAX_SECONDS,
    );
  }

  async selectExchange(): Promise<Provider> {
    const providers = (await this.getProviderList()).filter(
      name => name && name !== Provider.LIFI.uiName,
    );

    for (const providerName of providers) {
      const provider = Object.values(Provider).find(p => p.uiName === providerName);
      if (provider && !provider.kyc && provider.isNative) {
        await this.webView.tapByTestId(`compact-quote-card-provider-name-${provider.name}`);
        return provider;
      }
    }
    throw new Error(
      `[swap-live-app] No non-KYC native provider available among: ${providers.join(", ")}`,
    );
  }

  getProviderList(): Promise<string[]> {
    return this.webView.waitForSelectorTextsMatchingCount(
      this.numberOfQuotes,
      this.quoteCardProviderSelector,
    );
  }

  checkExchangeButtonHasProviderName(providerUiName: string): Promise<string> {
    return this.webView.waitForSelectorMatches(
      this.providerExecuteButtonSelector(providerUiName),
      `^(Swap|Continue) with ${providerUiName}$`,
      "i",
    );
  }

  async tapExecuteSwap(providerUiName: string): Promise<void> {
    await this.waitForFreshQuote();
    await this.webView.tapBySelectorWhenEnabled(this.providerExecuteButtonSelector(providerUiName));
  }

  private waitForFreshQuote(): Promise<void> {
    return this.webView.waitForTestIdNumberAtLeast(
      this.quotesCountdown,
      MIN_QUOTE_SECONDS_FOR_EXECUTE,
    );
  }
}
