import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { floatNumberRegex } from "@ledgerhq/live-common/e2e/data/regexes";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { getByTestId } from "../components/appiumSelector.ts";

export class SwapLiveAppPage {
  // webview components
  get fromSelector() {
    return $('[data-testid="from-account-coin-selector"]');
  }

  get fromAmountInput() {
    return $('[data-testid="from-account-amount-input"]');
  }

  get toSelector() {
    return $('[data-testid="to-account-coin-selector"]');
  }

  get toAmountInput() {
    return $('[data-testid="to-account-amount-input"]');
  }

  get quotesButtonDisabled() {
    return $('[data-testid="mobile-get-quotes-button-disabled"]');
  }

  get getQuotesButton() {
    return $('[data-testid="mobile-get-quotes-button"]');
  }

  get numberOfQuotes() {
    return $('[data-testid="number-of-quotes"]');
  }

  get quotesCountDown() {
    return $('[data-testid="quotes-countdown"]');
  }

  get mainContainer() {
    return $("main");
  }

  get quoteCardProviderNames() {
    return this.mainContainer.$$("[data-testid^='compact-quote-card-provider-']");
  }

  // dynamic components
  public getQuoteCardByProviderName(providerName: string) {
    return $(`[data-testid="compact-quote-card-provider-name-${providerName.toLowerCase()}"]`);
  }

  public providerExecuteButton(provider: string) {
    return $(`${this.baseProviderCssSelector(provider)} [data-testid="execute-button"]`);
  }

  // reusable selectors
  private baseProviderCssSelector(provider: string) {
    return `[data-testid^="quote-container-${Provider.getNameByUiName(provider)}"]`;
  }

  // steps
  async switchTo() {
    await driver.waitUntil(
      async () => {
        console.log("Waiting for Swap Live App webview to be displayed...");
        await getByTestId("wallet-api-webview").waitForDisplayed();
        console.log("Switching to Swap Live App webview context");
        await driver.switchContext({ title: /swap/i });
        return true;
      },
      {
        interval: 5_000,
        timeout: 120_000,
        timeoutMsg: "Expected to switch to swap live app webview",
      },
    );
  }

  async expectLiveApp() {
    // DETOX:
    // await waitWebElementByTestId(this.fromSelector);
    // await detoxExpect(getWebElementByTestId(this.fromSelector)).toExist();
    // await detoxExpect(getWebElementByTestId(this.toSelector)).toExist();
    // await detoxExpect(getWebElementByTestId(this.quotesButtonDisabled)).toExist();

    // WDIO:
    console.log("Checking Swap Live App is displayed");
    // await this.switchTo();
    await expect(this.fromSelector).toBeDisplayed();
    await expect(this.toSelector).toBeDisplayed();
    // await expect(this.quotesButtonDisabled).toBeDisplayed();
    // await driver.switchAppiumContext("NATIVE_APP");
  }

  async getMinimumAmount(fromAccount: Account, toAccount: Account, providersWhitelist?: string[]) {
    return (
      (await getMinimumSwapAmount(fromAccount, toAccount, providersWhitelist))?.toString() ?? ""
    );
  }

  async getFromCurrencyTexts() {
    // await this.switchTo();
    const text = await this.fromSelector.getText();
    // await driver.switchAppiumContext("NATIVE_APP");
    return text;
  }

  async getToCurrencyTexts() {
    // await this.switchTo();
    const text = await this.toSelector.getText();
    // await driver.switchAppiumContext("NATIVE_APP");
    return text;
  }

  async tapFromCurrency() {
    // await this.switchTo();
    await this.fromSelector.tap();
    // await driver.switchAppiumContext("NATIVE_APP");
  }

  async tapToCurrency() {
    // await this.switchTo();
    await this.toSelector.tap();
    // await driver.switchAppiumContext("NATIVE_APP");
  }

  async verifyCurrencyIsSelected(ticker: string, isFromCurrency: boolean) {
    // await this.switchTo();
    const selectorToValidate = isFromCurrency ? this.fromSelector : this.toSelector;
    await expect(selectorToValidate).toHaveText(expect.stringContaining(ticker));
    // await driver.switchAppiumContext("NATIVE_APP");
  }

  async inputFromAmount(amount: string) {
    // await this.switchTo();
    await this.fromAmountInput.setValue(amount);
    // await driver.switchAppiumContext("NATIVE_APP");
  }

  async expectToAmountFloat() {
    // await this.switchTo();
    await expect(this.toAmountInput).toHaveText(floatNumberRegex);
    // await driver.switchAppiumContext("NATIVE_APP");
  }

  async tapGetQuotesButton() {
    // await this.switchTo();
    await this.getQuotesButton.tap();
    // await driver.switchAppiumContext("NATIVE_APP");
  }

  async waitForQuotes() {
    // await this.switchTo();
    await this.numberOfQuotes.waitForDisplayed();
    await this.waitForQuotesStable();
    // await driver.switchAppiumContext("NATIVE_APP");
  }

  async waitForQuotesStable(timeout: number = 20000) {
    // await this.switchTo();
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
    // await driver.switchAppiumContext("NATIVE_APP");
  }

  async getProviderList() {
    // await this.switchTo();

    await expect(this.numberOfQuotes).toBeDisplayed();
    await expect(this.quotesCountDown).toBeDisplayed();

    const providerList = await driver.waitUntil(
      async () => {
        const numberOfQuotesText = await this.numberOfQuotes.getText();
        const providerList = await this.quoteCardProviderNames.map(card => card.getText());

        if (!numberOfQuotesText.match(new RegExp(`^${providerList.length} quotes? found$`))) {
          console.log(
            `Quote count mismatch: UI shows "${numberOfQuotesText}" but found ${providerList.length} cards`,
          );
          return false;
        }
        return providerList;
      },
      {
        timeout: 30_000,
        timeoutMsg: "Expected provider list to be up to date within 30s",
      },
    );
    // await driver.switchAppiumContext("NATIVE_APP");
    return providerList;
  }

  async selectExchange() {
    // TODO: optimise nested webview functions
    // await this.switchTo();
    const providers = await this.getProviderList();
    const providersList = providers.filter(name => name !== Provider.LIFI.uiName);

    const providersWithoutKYC = providersList.filter(providerName => {
      const provider = Object.values(Provider).find(p => p.uiName === providerName);
      // return provider && !provider.kyc; -> original
      return provider && !provider.kyc && provider.name !== Provider.OKX.name;
    });

    let selectedProvider;

    // TODO: optimise nested webview functions
    // await this.switchTo();
    for (const providerName of providersWithoutKYC) {
      const provider = Object.values(Provider).find(p => p.uiName === providerName);
      if (provider?.isNative) {
        await this.getQuoteCardByProviderName(provider.name).tap();
        selectedProvider = provider;
        break;
      }
    }
    if (!selectedProvider) {
      throw new Error("No providers without KYC found");
    }
    // await driver.switchAppiumContext("NATIVE_APP");
    return selectedProvider;
  }

  async checkExchangeButtonHasProviderName(provider: string): Promise<string> {
    // await this.switchTo();
    await expect(this.providerExecuteButton(provider)).toHaveText(
      new RegExp(`^(Swap|Continue) with ${provider}$`, "i"),
    );
    const buttonText = await this.providerExecuteButton(provider).getText();
    // await driver.switchAppiumContext("NATIVE_APP");
    return buttonText;
  }

  async tapExecuteSwap(provider: string) {
    // await this.switchTo();
    await this.providerExecuteButton(provider).tap();
    // await driver.switchAppiumContext("NATIVE_APP");
  }
}
