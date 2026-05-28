import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { WebViewHelper } from "../runtime/webView";

export class SwapLiveAppPage {
  readonly fromSelector = "from-account-coin-selector";
  readonly fromAmountInput = "from-account-amount-input";
  readonly toSelector = "to-account-coin-selector";
  readonly getQuotesButton = "mobile-get-quotes-button";
  readonly numberOfQuotes = "number-of-quotes";
  readonly quoteCardProviderSelector = "[data-testid^='compact-quote-card-provider-']";
  readonly executeSwapButton = "execute-button";

  readonly providerCardTestId = (providerName: string) =>
    `compact-quote-card-provider-name-${providerName}`;

  constructor(private readonly webView: WebViewHelper) {}

  async expectSwapLiveApp(): Promise<void> {
    await this.webView.waitForTestId(this.fromSelector);
    await this.webView.waitForTestId(this.toSelector);
  }

  async tapFromCurrency(): Promise<void> {
    await this.webView.tapByTestId(this.fromSelector);
  }

  async tapToCurrency(): Promise<void> {
    await this.webView.tapByTestId(this.toSelector);
  }

  async inputAmount(amount: string): Promise<void> {
    await this.webView.typeText(this.fromAmountInput, amount);
  }

  async tapGetQuotes(): Promise<void> {
    await this.webView.tapByTestId(this.getQuotesButton);
  }

  async waitForQuotes(timeoutMs: number = 60_000): Promise<void> {
    await this.webView.waitForTestId(this.numberOfQuotes, timeoutMs);
  }

  async getProviderList(): Promise<string[]> {
    return await this.webView.querySelectorAllText(this.quoteCardProviderSelector);
  }

  async getFromCurrencyText(): Promise<string> {
    return await this.webView.getText(this.fromSelector);
  }

  async getToCurrencyText(): Promise<string> {
    return await this.webView.getText(this.toSelector);
  }

  /**
   * Pick the first non-KYC native provider from the list of available quotes.
   * Mirrors the Detox `selectExchange()` heuristic, sans Li.FI exclusion.
   */
  async selectExchange(): Promise<Provider> {
    const providersList = (await this.getProviderList()).filter(
      name => name !== Provider.LIFI.uiName,
    );

    for (const providerName of providersList) {
      const provider = Object.values(Provider).find(p => p.uiName === providerName);
      if (provider && !provider.kyc && provider.isNative) {
        await this.webView.tapByTestId(this.providerCardTestId(provider.name));
        return provider;
      }
    }
    throw new Error(
      `[swap-live-app] No non-KYC native provider available among: ${providersList.join(", ")}`,
    );
  }

  async tapExecuteSwap(): Promise<void> {
    await this.webView.tapByTestId(this.executeSwapButton);
  }

  async getMinimumAmount(
    fromAccount: Account,
    toAccount: Account,
    providersWhitelist?: string[],
  ): Promise<string> {
    const min = await getMinimumSwapAmount(fromAccount, toAccount, providersWhitelist);
    return min !== null && min !== undefined ? String(min) : "";
  }
}
