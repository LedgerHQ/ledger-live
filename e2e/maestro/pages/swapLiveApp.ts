import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { WebViewHelper } from "../runtime/webView";

export type CurrencyField = "from" | "to";

// Minimum seconds left on the live quote before executing, so the swap tx is
// built and reaches the device before the quote expires (otherwise the device
// never receives the transaction). The quote counts down from ~20s.
const MIN_QUOTE_SECONDS_FOR_EXECUTE = 12;

// After tapping "execute", RFQ / floating-rate quotes route through a "Complete
// steps" two-step approval screen; fixed-rate quotes skip it and go straight to
// the device. Bound how long we probe for that screen so the fixed-rate path is
// not penalised when it never appears.
const STEP_APPROVAL_DETECT_TIMEOUT_MS = 15_000;

export class SwapLiveAppPage {
  private readonly coinSelector: Record<CurrencyField, string> = {
    from: "from-account-coin-selector",
    to: "to-account-coin-selector",
  };
  private readonly fromAmountInput = "from-account-amount-input";
  private readonly getQuotesButton = "mobile-get-quotes-button";
  private readonly numberOfQuotes = "number-of-quotes";
  private readonly quotesCountdown = "quotes-countdown";
  private readonly quoteCardProviderSelector = "[data-testid^='compact-quote-card-provider-']";
  private readonly executeSwapButton = "execute-button";
  private readonly executeSwapButtonStepApproval = "execute-swap-button-step-approval";

  constructor(private readonly webView: WebViewHelper) {}

  async expectSwapLiveApp(): Promise<void> {
    await this.webView.waitForTestId(this.coinSelector.from);
    await this.webView.waitForTestId(this.coinSelector.to);
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

  tapGetQuotes(): Promise<void> {
    return this.webView.tapByTestIdWhenEnabled(this.getQuotesButton);
  }

  waitForQuotes(): Promise<void> {
    return this.webView.waitForTestId(this.numberOfQuotes);
  }

  async selectExchange(): Promise<Provider> {
    const providers = (await this.listProviders()).filter(name => name !== Provider.LIFI.uiName);

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

  async tapExecuteSwap(): Promise<void> {
    await this.waitForFreshQuote();
    await this.webView.tapByTestIdWhenEnabled(this.executeSwapButton);
    await this.confirmTwoStepApprovalIfPresent();
  }

  private async confirmTwoStepApprovalIfPresent(): Promise<void> {
    const onApprovalStep = await this.webView.waitForTestIdToAppear(
      this.executeSwapButtonStepApproval,
      STEP_APPROVAL_DETECT_TIMEOUT_MS,
    );
    if (!onApprovalStep) return;

    if (await this.webView.testIdExists(this.quotesCountdown)) {
      await this.waitForFreshQuote();
    }
    await this.webView.tapByTestIdWhenEnabled(this.executeSwapButtonStepApproval);
  }

  private waitForFreshQuote(): Promise<void> {
    return this.webView.waitForTestIdNumberAtLeast(
      this.quotesCountdown,
      MIN_QUOTE_SECONDS_FOR_EXECUTE,
    );
  }

  private listProviders(): Promise<string[]> {
    return this.webView.querySelectorAllText(this.quoteCardProviderSelector);
  }
}
