import { Provider } from "@ledgerhq/live-common/e2e/enum/Swap";
import { allure } from "jest-allure2-reporter/api";
import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";

export default class SwapLiveAppPage {
  fromSelector = "from-account-coin-selector";
  fromAmount = "from-account";
  fromAmountInput = "from-account-amount-input";
  toSelector = "to-account-coin-selector";
  getQuotesButton = "mobile-get-quotes-button";
  numberOfQuotes = "number-of-quotes";
  quotesCountDown = "quotes-countdown";
  quoteProviderName = "quote-card-provider-name";
  executeSwapButton = "execute-button";
  deviceActionErrorDescriptionId = "error-description-deviceAction";

  @Step("Wait for swap live app")
  async waitForSwapLiveApp() {
    await waitWebElementByTestId(this.getQuotesButton);
  }

  @Step("Tap from currency")
  async tapFromCurrency() {
    await tapWebElementByTestId(this.fromSelector);
  }

  @Step("Tap to currency")
  async tapToCurrency() {
    await tapWebElementByTestId(this.toSelector);
  }

  @Step("Input amount")
  async inputAmount(amount: string) {
    await typeTextByWebTestId(this.fromAmountInput, amount);
  }

  @Step("Tap get quotes button")
  async tapGetQuotesButton() {
    await tapWebElementByTestId(this.getQuotesButton);
  }

  @Step("Wait for quotes")
  async waitForQuotes() {
    await waitWebElementByTestId(this.numberOfQuotes);
  }

  @Step("Select available provider")
  async selectExchange() {
    let index = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const providerName = await getWebElementText(this.quoteProviderName, index);
        const provider = Object.values(Provider).find(p => p.uiName === providerName);

        if (provider && !provider.kyc && provider.isNative) {
          await getWebElementByTestId(this.quoteProviderName, index).tap();
          await allure.attachment("Selected provider: ", providerName, "text/plain");
          return providerName;
        }

        index++;
      } catch (e) {
        break;
      }
    }
    throw new Error("No valid providers found");
  }

  @Step("Tap execute swap button")
  async tapExecuteSwap() {
    await tapWebElementByTestId(this.executeSwapButton, 1);
  }

  @Step("Get minimum amount for swap")
  async getMinimumAmount(swap: SwapType) {
    return (
      (await getMinimumSwapAmount(swap.accountToDebit, swap.accountToCredit))?.toString() ?? ""
    );
  }

  @Step("Get provider list")
  async getProviderList() {
    await detoxExpect(getWebElementByTestId(this.numberOfQuotes)).toExist();
    await detoxExpect(getWebElementByTestId(this.quotesCountDown)).toExist();
    return await getWebElementsText(this.quoteProviderName);
  }

  @Step("Check error message: $0")
  async checkErrorMessage(errorMessage: string) {
    const error = await getTextOfElement(this.deviceActionErrorDescriptionId);
    jestExpect(error).toContain(errorMessage);
  }

  @Step("Check quotes container infos")
  async checkQuotesContainerInfos(providerList: string[]) {
    const provider = Provider.getNameByUiName(providerList[0]);
    const baseProviderLocator = `quote-container-${provider}-`;

    await tapWebElementByTestId(baseProviderLocator + "amount-label");

    await detoxExpect(getWebElementByTestId(baseProviderLocator + "amount-label")).toExist();
    await detoxExpect(getWebElementByTestId(baseProviderLocator + "fiatAmount-label")).toExist();
    await detoxExpect(getWebElementByTestId(baseProviderLocator + "networkFees-heading")).toExist();
    await detoxExpect(
      getWebElementByTestId(baseProviderLocator + "networkFees-infoIcon"),
    ).toExist();
    await detoxExpect(getWebElementByTestId(baseProviderLocator + "networkFees-value")).toExist();
    await detoxExpect(
      getWebElementByTestId(baseProviderLocator + "networkFees-fiat-value"),
    ).toExist();
    await detoxExpect(getWebElementByTestId(baseProviderLocator + "rate-heading")).toExist();
    await detoxExpect(getWebElementByTestId(baseProviderLocator + "rate-value")).toExist();
    await detoxExpect(getWebElementByTestId(baseProviderLocator + "rate-fiat-value")).toExist();
    if (
      provider === Provider.ONE_INCH.name ||
      provider === Provider.PARASWAP.name ||
      provider === Provider.UNISWAP.name ||
      provider === Provider.LIFI.name
    ) {
      await detoxExpect(getWebElementByTestId(baseProviderLocator + "slippage-heading")).toExist();
      await detoxExpect(getWebElementByTestId(baseProviderLocator + "slippage-value")).toExist();
    }
    await this.checkExchangeButton(providerList[0]);
  }

  @Step("Check exchange button is visible and enabled")
  async checkExchangeButton(provider: string) {
    const expectedButtonText = [
      Provider.ONE_INCH.uiName,
      Provider.PARASWAP.uiName,
      Provider.MOONPAY.uiName,
    ].includes(provider)
      ? `Continue with ${provider}`
      : `Swap with ${provider}`;

    const exchangeButton = getWebElementByTag("button");
    await detoxExpect(exchangeButton).toExist();
    jestExpect(await exchangeButton.getText()).toBe(expectedButtonText);
  }

  @Step('Check "Best Offer" corresponds to the best quote')
  async checkBestOffer() {
    const quoteContainers = await this.getAllSwapProviders();
    try {
      const quotes = await this.extractQuotesAndFees(quoteContainers);
      const bestOffer = quotes.reduce<{ rate: number; fees: number; quote: string } | null>(
        (max, current) =>
          current && (!max || current.rate - current.fees > max.rate - max.fees) ? current : max,
        null,
      );
      jestExpect(bestOffer?.quote).toContain("Best Offer");
    } catch (error) {
      console.error("Error checking Best offer:", error);
    }
  }

  @Step("Get all swap providers available")
  async getAllSwapProviders() {
    return await getWebElementsByCssSelector(
      '[data-testid^="quote-container-"][data-testid$="-fixed"], [data-testid^="quote-container-"][data-testid$="-float"]',
    );
  }

  @Step("Extract quotes and fees")
  async extractQuotesAndFees(quoteContainers: string[]) {
    const quotes = quoteContainers
      .map(quote => {
        const match = quote.match(/\$(\d+\.\d+).*?Network Fees[^$]*\$(\d+\.\d+)/);
        if (match) {
          const rate = parseFloat(match[1]);
          const fees = parseFloat(match[2]);
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
}
