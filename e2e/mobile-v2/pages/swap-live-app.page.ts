import { getMinimumSwapAmount } from "@ledgerhq/live-e2e-shared/swap";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { floatNumberRegex } from "@ledgerhq/live-e2e-shared/data/regexes";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { webById, webBy } from "@e2e-mobile/components/ElementHandle";
import { webview } from "@e2e-mobile/components/SwitchToWebview";
import { step } from "@wdio/allure-reporter";

export class SwapLiveAppPage {
  private static readonly PROVIDER_NAME_PREFIX = "lumen-quote-card-provider-name-";

  // webview components
  private readonly swapWebview = webview({ title: "swap" });
  private readonly fromSelector = webById("from-account-coin-selector", this.swapWebview);
  private readonly toSelector = webById("to-account-coin-selector", this.swapWebview);
  private readonly fromAmountInput = webById("from-account-amount-input", this.swapWebview);
  private readonly toAmountInput = webById("to-account-amount-input", this.swapWebview);
  private readonly getQuotesButton = webById("mobile-get-quotes-button", this.swapWebview);
  private readonly bestValueInfoIcon = webById("best-value-info-icon", this.swapWebview);
  private readonly quotesCountDown = webById("quotes-countdown", this.swapWebview);
  private readonly mainContainer = webBy("main", this.swapWebview);
  private readonly quoteCardProviderNames = this.mainContainer.nestedBy(
    `[data-testid^='${SwapLiveAppPage.PROVIDER_NAME_PREFIX}']`,
  );
  private readonly quotesButtonDisabled = webById(
    "mobile-get-quotes-button-disabled",
    this.swapWebview,
  );

  // dynamic components
  public getQuoteCardByProviderName(providerName: string) {
    // Prefix match: the testid ends with the quote's provider id, which can extend the e2e name
    // (1inch renders as `oneinchfusion` when its Fusion quote wins).
    return webBy(
      `[data-testid^='${SwapLiveAppPage.PROVIDER_NAME_PREFIX}${providerName.toLowerCase()}']`,
      this.swapWebview,
    );
  }

  public providerExecuteButton(provider: string) {
    // Prefix match: the container testid can extend the provider name.
    return webBy(
      `[data-testid^="quote-container-${SwapProvider.getNameByUiName(provider)}"] [data-testid="execute-button"]`,
      this.swapWebview,
    );
  }

  async expectLiveApp() {
    await step("Expect swap live app to be displayed", async () => {
      await this.fromSelector.expectVisible();
      await this.toSelector.expectVisible();
    });
  }

  async getMinimumAmount(
    fromAccount: Account,
    toAccount: Account,
    providersWhitelist?: string[],
  ): Promise<string> {
    return await step("Get minimum amount for swap", async () => {
      const minAmount = await getMinimumSwapAmount({
        accountFrom: fromAccount,
        accountTo: toAccount,
        providersWhitelist,
      });
      return minAmount?.toString() ?? "";
    });
  }

  async getFromCurrencyTexts(): Promise<string> {
    return await step("Get FROM currency text", async () => {
      const text = await this.fromSelector.getText();
      return text;
    });
  }

  async getToCurrencyTexts(): Promise<string> {
    return await step("Get TO currency text", async () => {
      const text = await this.toSelector.getText();
      return text;
    });
  }

  async tapFromCurrency() {
    await step("Tap FROM currency", async () => {
      await this.fromSelector.tap();
    });
  }

  async tapToCurrency() {
    await step("Tap TO currency", async () => {
      await this.toSelector.tap();
    });
  }

  async verifyCurrencyIsSelected(ticker: string, isFromCurrency: boolean) {
    await step(
      `Verify ${isFromCurrency ? "FROM" : "TO"} currency is selected: ${ticker}`,
      async () => {
        const selectorToValidate = isFromCurrency ? this.fromSelector : this.toSelector;
        await selectorToValidate.expectText(ticker, { containing: true });
      },
    );
  }

  async inputFromAmount(amount: string) {
    await step(`Input FROM amount: ${amount}`, async () => {
      await this.fromAmountInput.replaceText(amount, { incremental: true });
    });
  }

  async expectToAmountFloat() {
    await step("Expect TO amount to be a float number", async () => {
      await this.toAmountInput.expectTextMatching(floatNumberRegex);
    });
  }

  async tapGetQuotesButton() {
    await step("Tap Get Quotes button", async () => {
      await this.getQuotesButton.tap();
    });
  }

  async waitForQuotes() {
    await step("Wait for quotes", async () => {
      await this.bestValueInfoIcon.waitVisible();
      await this.waitForQuotesStable();
    });
  }

  async waitForQuotesStable(timeout: number = 20000) {
    await step("Wait for quotes to be stable", async () => {
      await driver.waitUntil(
        async () => {
          const countdownText = await this.quotesCountDown.getText();
          const currentSeconds = Number.parseInt(countdownText.replaceAll(/\D/g, ""), 10);

          if (Number.isNaN(currentSeconds)) {
            throw new TypeError(`Could not parse countdown value: ${countdownText}`);
          }

          if (currentSeconds < 2 || currentSeconds > 19) {
            console.log(`Countdown is ${currentSeconds}s, waiting for value between 2-19s`);
            return false;
          }
          return currentSeconds;
        },
        {
          timeout,
          timeoutMsg: `Expected countdown to stabilize within ${timeout}ms`,
        },
      );
    });
  }

  async getProviderList(): Promise<string[]> {
    return await step("Get provider list", async () => {
      await this.bestValueInfoIcon.expectVisible();
      await this.quotesCountDown.expectVisible();

      let previousCount = -1;
      // The list is settled once two consecutive reads return the same number of cards.
      return await driver.waitUntil(
        async () => {
          const providerList = await this.quoteCardProviderNames.getAllTexts();
          if (providerList.length === 0 || providerList.length !== previousCount) {
            previousCount = providerList.length;
            return false;
          }
          return providerList;
        },
        {
          timeout: 30_000,
          interval: 1_000,
          timeoutMsg: "Expected provider list to settle within 30s",
        },
      );
    });
  }

  async selectExchange() {
    return await step("Select exchange provider", async () => {
      const providers = await this.getProviderList();
      const providersList = providers.filter(name => name !== SwapProvider.LIFI.uiName);

      let selectedProvider;

      for (const providerName of providersList) {
        const provider = SwapProvider.getByUiName(providerName);
        if (provider && !provider.kyc && !provider.app) {
          await this.getQuoteCardByProviderName(provider.name).tap();
          selectedProvider = provider;
          break;
        }
      }
      if (!selectedProvider) {
        throw new Error("No single-app exchange providers found");
      }
      return selectedProvider;
    });
  }

  // Only asserts the CTA is present; ignores its label so an A/B-tested label cannot fail callers.
  async checkQuoteCardCtaPresence(provider: string): Promise<void> {
    await step(`Check exchange CTA presence: ${provider}`, async () => {
      if (!SwapProvider.getNameByUiName(provider)) {
        throw new Error(`Unknown provider UI name: "${provider}"`);
      }
      await this.providerExecuteButton(provider).waitVisible();
    });
  }

  async tapExecuteSwap(provider: string) {
    await step(`Tap execute swap for provider: ${provider}`, async () => {
      await this.providerExecuteButton(provider).tap();
    });
  }
}
