import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { addDelayBeforeInteractingWithDevice } from "../../helpers/commonHelpers";

export default class SwapLiveAppPage {
  fromSelector = "from-account-coin-selector";
  fromAmount = "from-account";
  fromAmountInput = "from-account-amount-input";
  toSelector = "to-account-coin-selector";
  toAmountInput = "to-account-amount-input";
  getQuotesButton = "mobile-get-quotes-button";
  quotesButtonDisabled = "mobile-get-quotes-button-disabled";
  numberOfQuotes = "number-of-quotes";
  quotesCountDown = "quotes-countdown";
  quoteCardProviderName = "compact-quote-card-provider-";
  executeSwapButton = "execute-button";
  deviceActionErrorDescriptionId = "error-description-deviceAction";
  fromAccountErrorId = "from-account-error";
  showDetailslink = "show-details-link";
  quotesContainerErrorIcon = "quotes-container-error-icon";
  insufficientFundsBuyButton = "insufficient-funds-buy-button";
  swapMaxToggle = "from-account-max-toggle";
  switchButton = "to-account-switch-accounts";
  liveAppTitle = "live-app-title";
  quoteInfosFeesSelector = "QuoteCard-info-fees-selector";
  specificQuoteCardProviderName = (provider: string) =>
    `compact-quote-card-provider-name-${provider}`;

  feeContainerId = (strategy: "slow" | "medium" | "fast") => `fee-container-${strategy}`;

  @Step("Wait for swap live app")
  async waitForSwapLiveApp() {
    await waitWebElementByTestId(this.quotesButtonDisabled);
  }

  @Step("Expect swap live app page")
  async expectSwapLiveApp() {
    await detoxExpect(getWebElementByTestId(this.fromSelector)).toExist();
    await detoxExpect(getWebElementByTestId(this.toSelector)).toExist();
    await detoxExpect(getWebElementByTestId(this.quotesButtonDisabled)).toExist();
  }

  @Step("Check if the from currency is already selected")
  async getFromCurrencyTexts() {
    return await getWebElementText(this.fromSelector);
  }

  @Step("Tap from currency")
  async tapFromCurrency() {
    await tapWebElementByTestId(this.fromSelector);
  }

  @Step("Verify currency is selected $0")
  async verifyCurrencyIsSelected(ticker: string, isFromCurrency: boolean) {
    const selector = isFromCurrency ? this.fromSelector : this.toSelector;
    const actualText = await getWebElementText(selector);
    jestExpect(actualText).toContain(ticker);
  }

  @Step("Tap to currency")
  async tapToCurrency() {
    await tapWebElementByTestId(this.toSelector);
  }

  @Step("Tap quote infos fees selector $0")
  async tapQuoteInfosFeesSelector(index: number) {
    await tapWebElementByTestId(this.quoteInfosFeesSelector, index);
  }

  @Step("Tap fee container $0")
  async tapFeeContainer(strategy: "slow" | "medium" | "fast") {
    await tapById(this.feeContainerId(strategy));
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

  @Step("verify quotes are displayed")
  async checkQuotes() {
    await detoxExpect(getWebElementByTestId(this.numberOfQuotes)).toExist();
  }

  @Step("Select available provider")
  async selectExchange() {
    const providersList = await this.getProviderList();

    const providersWithoutKYC = providersList.filter(providerName => {
      const provider = Object.values(Provider).find(p => p.uiName === providerName);
      return provider && !provider.kyc;
    });
    for (const providerName of providersWithoutKYC) {
      const provider = Object.values(Provider).find(p => p.uiName === providerName);
      if (provider && provider.isNative) {
        await waitWebElementByTestId(this.specificQuoteCardProviderName(provider.name));
        const selectedProvider = getWebElementsByIdAndText(
          this.specificQuoteCardProviderName(provider.name),
          provider.uiName,
        );
        await tapWebElementByElement(selectedProvider);

        return provider;
      }
    }
    throw new Error("No providers without KYC found");
  }

  @Step("Tap execute swap button")
  async tapExecuteSwap() {
    await waitWebElementByTestId(this.executeSwapButton);
    await tapWebElementByTestId(this.executeSwapButton);
  }

  @Step("Get minimum amount for swap")
  async getMinimumAmount(fromAccount: Account, toAccount: Account) {
    return (await getMinimumSwapAmount(fromAccount, toAccount))?.toString() ?? "";
  }

  @Step("Get provider list")
  async getProviderList() {
    await detoxExpect(getWebElementByTestId(this.numberOfQuotes)).toExist();
    await detoxExpect(getWebElementByTestId(this.quotesCountDown)).toExist();
    const providerList = await getWebElementsByCssSelector(
      `[data-testid^='${this.quoteCardProviderName}']`,
    );
    const numberOfQuotesText: string = await getWebElementText(this.numberOfQuotes);
    jestExpect(numberOfQuotesText).toEqual(`${providerList.length} quotes found`);
    return providerList;
  }

  @Step("Check error message: $0")
  async checkErrorMessage(errorMessage: string) {
    await addDelayBeforeInteractingWithDevice();
    const error = await getTextOfElement(this.deviceActionErrorDescriptionId);
    jestExpect(error).toContain(errorMessage);
  }

  @Step("Check first quote container infos")
  async checkFirstQuoteContainerInfos(providerList: string[]) {
    const provider: string = Provider.getNameByUiName(providerList[0]);
    const baseProviderLocator = `quote-container-${provider}-`;
    await waitWebElementByTestId(baseProviderLocator + "amount-label");
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
      provider === Provider.VELORA.name ||
      provider === Provider.UNISWAP.name ||
      provider === Provider.LIFI.name
    ) {
      await detoxExpect(getWebElementByTestId(baseProviderLocator + "slippage-heading")).toExist();
      await detoxExpect(getWebElementByTestId(baseProviderLocator + "slippage-value")).toExist();
    }
    await this.checkExchangeButtonHasProviderName(providerList[0]);
  }

  @Step("Check exchange button has provider name: $0")
  async checkExchangeButtonHasProviderName(provider: string) {
    const expectedButtonText = [
      Provider.ONE_INCH.uiName,
      Provider.VELORA.uiName,
      Provider.MOONPAY.uiName,
    ].includes(provider)
      ? `Continue with ${provider}`
      : `Swap with ${provider}`;

    await waitWebElementByTestId(this.executeSwapButton);
    const actualButtonText = await getWebElementText(this.executeSwapButton);
    jestExpect(actualButtonText).toEqual(expectedButtonText);
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
    const quotePattern = /\$(\d+\.\d+)[\s\S]*?Network Fees[\s\S]*?\$(\d+\.\d+)/;

    const quotes = quoteContainers
      .map(q => {
        const match = q.match(quotePattern);
        if (match) {
          return { rate: parseFloat(match[1]), fees: parseFloat(match[2]), quote: q };
        }
        return undefined;
      })
      .filter(Boolean) as Array<{ rate: number; fees: number; quote: string }>;

    if (quotes.length === 0) {
      throw new Error("No quotes found");
    }
    return quotes;
  }

  @Step("Verify swap amount error message match: $0")
  async verifySwapAmountErrorMessageIsCorrect(expectedMessage: string | RegExp) {
    await waitWebElementByTestId(this.fromAccountErrorId);
    const errorText: string = await getWebElementText(this.fromAccountErrorId);
    if (typeof expectedMessage === "string") {
      jestExpect(errorText).toContain(expectedMessage);
    } else {
      jestExpect(errorText).toMatch(expectedMessage);
    }
  }

  @Step("Verify swap CTA banner displayed")
  async checkCtaBanner() {
    await waitWebElementByTestId(this.showDetailslink);
    const showDetailsLink = getWebElementByTestId(this.showDetailslink);
    await showDetailsLink.runScript(el => el.click());
    await detoxExpect(getWebElementByTestId(this.quotesContainerErrorIcon)).toExist();
    await detoxExpect(getWebElementByTestId(this.insufficientFundsBuyButton)).toExist();
  }

  @Step("Click on swap max")
  async clickSwapMax() {
    await tapWebElementByTestId(this.swapMaxToggle);
  }

  @Step("Retrieve send currency amount value")
  async getAmountToSend() {
    return await getValueByWebTestId(this.fromAmountInput);
  }

  @Step("Retrieve receive currency amount value")
  async getAmountToReceive() {
    return await getValueByWebTestId(this.toAmountInput);
  }

  @Step("Tap on Switch currencies button")
  async switchYouSendAndYouReceive() {
    await tapWebElementByTestId(this.switchButton);
  }

  @Step("Check currency to swap from is $0")
  async checkAssetFrom(currency: string, amount: string) {
    const fromAccount: string = await getWebElementText(this.fromSelector);
    const amountToSend = await app.swapLiveApp.getAmountToSend();
    jestExpect(fromAccount).toContain(currency);
    jestExpect(amountToSend).toEqual(amount);
  }

  @Step("Check currency to swap to is $0 with amount $1")
  async checkAssetTo(currency: string, amount: string) {
    const assetTo: string = await getWebElementText(this.toSelector);
    if (currency === "") {
      jestExpect(assetTo).toContain("Choose asset");
    } else {
      jestExpect(assetTo).toContain(currency);
    }
    const amountToReceive = await app.swapLiveApp.getAmountToReceive();
    jestExpect(amountToReceive).toEqual(amount);
  }

  @Step("Select specific provider $0")
  async selectSpecificProvider(provider: string) {
    const providersList = await this.getProviderList();

    if (!providersList.includes(provider)) {
      throw new Error(`Provider "${provider}" not found in the list`);
    }

    await waitWebElementByTestId(this.specificQuoteCardProviderName(provider));
    const selectedProvider = getWebElementsByIdAndText(
      this.specificQuoteCardProviderName(provider),
      provider,
    );
    await tapWebElementByElement(selectedProvider);
  }

  @Step("Go to $0 live app")
  async goToProviderLiveApp(provider: string) {
    const continueButton = getWebElementByTestId(this.executeSwapButton, 1);
    await detoxExpect(continueButton).toExist();
    await this.checkExchangeButtonHasProviderName(provider);
    await this.tapExecuteSwap();
  }

  @Step("Verify live app title contains $0")
  async verifyLiveAppTitle(provider: string) {
    const liveApp = await getTextOfElement(this.liveAppTitle);
    jestExpect(liveApp?.toLowerCase()).toContain(provider);
  }
}
