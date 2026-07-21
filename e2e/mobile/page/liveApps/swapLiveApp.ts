import { Step } from "jest-allure2-reporter/api";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { getMinimumSwapAmount } from "@ledgerhq/live-e2e-shared/swap";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { retryUntilTimeout } from "../../utils/retry";
import { floatNumberRegex } from "@ledgerhq/live-e2e-shared/data/regexes";

// Uniswap's Permit2 "Approve token access" step can take 1-5 min to confirm on-chain
// before the sign-permit button (Step 2) appears (the app shows a "1-5 mins" estimate).
const APPROVAL_PROCESSING_TIMEOUT = 300_000;

// Provider UI names (e.g. "Swaps.xyz", "LI.FI") can contain regex metacharacters. Escape them
// before embedding in a RegExp so they match literally instead of altering the pattern.
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Net value of a quote as shown on screen: amount received minus network fees (both in fiat).
const quoteNetValue = (quote: { rate: number; fees: number }) => quote.rate - quote.fees;

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
  quoteCardProviderNameSelector = "[data-testid^='compact-quote-card-provider-']";
  executeSwapButton = "execute-button";
  executeSwapButtonStepApproval = "execute-swap-button-step-approval";
  deviceActionErrorDescriptionId = "error-description-deviceAction";
  fromAccountErrorId = "from-account-error";
  showDetailslink = "show-details-link";
  quotesContainerErrorIcon = "quotes-container-error-icon";
  insufficientFundsBuyButton = "insufficient-funds-buy-button";
  fromAccountAccountNameTag = "from-account-account-name-tag";
  toAccountAccountNameTag = "to-account-account-name-tag";
  incompatibilityBannerPartnerId = "incompatibility-banner-partner";
  swapMainContainerCssSelector = "main";
  swapMainContainerWebElement = getWebElementByCssSelector(this.swapMainContainerCssSelector);
  swapMaxToggle = "from-account-max-toggle";
  switchButton = "to-account-switch-accounts";
  lnsUnsupportedBannerPattern =
    /Ledger Nano S[\s\S]*(not supported|unsupported|does not support|not compatible)/i;
  revokeApprovalButton = "revoke-approval-button";
  giveApprovalButton = "give-approval-button";
  signPermitButton = "sign-permit-button";
  specificQuoteCardProviderName = (provider: string) =>
    `compact-quote-card-provider-name-${provider}`;
  baseProviderCssSelector = (provider: string) =>
    `[data-testid^="quote-container-${SwapProvider.getNameByUiName(provider)}"]`;
  providerExecuteButtonCss = (provider: string) =>
    `${this.baseProviderCssSelector(provider)} [data-testid="${this.executeSwapButton}"]`;
  providerQuoteContainerSelector = (provider: string) =>
    `${this.baseProviderCssSelector(provider)}[data-testid$="-fixed"], ${this.baseProviderCssSelector(provider)}[data-testid$="-float"]`;
  incompatibilityBannerPartnerSelector = (provider: string) =>
    `${this.baseProviderCssSelector(provider)} [data-testid="${this.incompatibilityBannerPartnerId}"]`;

  @Step("Expect swap live app page")
  async expectSwapLiveApp() {
    await waitWebElementByTestId(this.fromSelector);
    await detoxExpect(getWebElementByTestId(this.fromSelector)).toExist();
    await detoxExpect(getWebElementByTestId(this.toSelector)).toExist();
    await detoxExpect(getWebElementByTestId(this.quotesButtonDisabled)).toExist();
  }

  @Step("Expect swap live app form")
  async expectSwapLiveAppForm() {
    await waitWebElementByTestId(this.fromSelector);
    await detoxExpect(getWebElementByTestId(this.fromSelector)).toExist();
    await detoxExpect(getWebElementByTestId(this.toSelector)).toExist();
  }

  @Step("Check if the from currency is already selected")
  async getFromCurrencyTexts() {
    await waitWebElementByTestId(this.fromSelector);
    return await getWebElementText(this.fromSelector);
  }

  @Step("Check if the to currency is already selected")
  async getToCurrencyTexts() {
    await waitWebElementByTestId(this.toSelector);
    return await getWebElementText(this.toSelector);
  }

  @Step("Tap from currency")
  async tapFromCurrency() {
    await tapWebElementByTestId(this.fromSelector);
  }

  @Step("Verify currency is selected")
  async verifyCurrencyIsSelected(ticker: string, isFromCurrency: boolean) {
    const selector = isFromCurrency ? this.fromSelector : this.toSelector;
    const actualText = await getWebElementText(selector);
    jestExpect(actualText).toContain(ticker);
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
    await getValueByWebTestId(this.toAmountInput);
    await tapWebElementByTestId(this.getQuotesButton);
  }

  @Step("Verify get quotes CTA is hidden")
  async expectQuotesButtonNotVisible() {
    await expectWebElementNotVisible(this.getQuotesButton);
    await expectWebElementNotVisible(this.quotesButtonDisabled);
  }

  @Step("Wait for quotes")
  async waitForQuotes() {
    await waitWebElementByTestId(this.numberOfQuotes);
    await this.waitForQuotesStable();
  }

  @Step("verify quotes are displayed")
  async checkQuotes() {
    await detoxExpect(getWebElementByTestId(this.numberOfQuotes)).toExist();
  }

  @Step("Select available provider")
  async selectExchange() {
    const providersList = (await this.getProviderList()).filter(
      name => name !== SwapProvider.LIFI.uiName,
    );

    for (const providerName of providersList) {
      const provider = SwapProvider.getByUiName(providerName);
      if (provider && !provider.kyc && !provider.app) {
        await waitWebElementByTestId(this.specificQuoteCardProviderName(provider.name));
        const selectedProvider = getWebElementsByIdAndText(
          this.specificQuoteCardProviderName(provider.name),
          provider.uiName,
        );
        await tapWebElementByElement(selectedProvider);

        return provider;
      }
    }
    throw new Error("No single-app exchange providers found");
  }

  @Step("Wait for quotes countdown to be stable")
  async waitForQuotesStable(timeout: number = 20000) {
    await retryUntilTimeout(async () => {
      const countdownText = await getWebElementText(this.quotesCountDown);
      const currentSeconds = Number.parseInt(countdownText.replaceAll(/\D/g, ""), 10);

      if (Number.isNaN(currentSeconds)) {
        throw new TypeError(`Could not parse countdown value: ${countdownText}`);
      }

      if (currentSeconds < 2 || currentSeconds > 19) {
        const errorMsg = `Countdown is ${currentSeconds}s, waiting for value between 2-19s`;
        console.log(errorMsg);
        throw new Error(errorMsg);
      }

      return currentSeconds;
    }, timeout);
  }

  @Step("Tap execute swap button")
  async tapExecuteSwap(provider: string) {
    const button = getWebElementByCssSelector(this.providerExecuteButtonCss(provider), 0);
    await waitWebElement(button);
    await tapWebElementByElement(button);
  }

  @Step("Expect execute swap button on step approval")
  async expectExecuteSwapOnStepApproval() {
    await waitWebElementByTestId(this.executeSwapButtonStepApproval, {
      timeout: APPROVAL_PROCESSING_TIMEOUT,
    });
    await detoxExpect(getWebElementByTestId(this.executeSwapButtonStepApproval)).toExist();
  }

  @Step("Tap execute swap button on step approval")
  async tapExecuteSwapOnStepApproval() {
    await waitWebElementByTestId(this.executeSwapButtonStepApproval, {
      timeout: APPROVAL_PROCESSING_TIMEOUT,
    });
    await waitForWebElementToBeEnabled(this.executeSwapButtonStepApproval);
    await tapWebElementByTestId(this.executeSwapButtonStepApproval);
    await waitForElement(app.send.summaryRecipient());
  }

  @Step("Get minimum amount for swap")
  async getMinimumAmount(fromAccount: Account, toAccount: Account, providersWhitelist?: string[]) {
    return (
      (await getMinimumSwapAmount(fromAccount, toAccount, providersWhitelist))?.toString() ?? ""
    );
  }

  @Step("Get provider list")
  async getProviderList() {
    await detoxExpect(getWebElementByTestId(this.numberOfQuotes)).toExist();
    await detoxExpect(getWebElementByTestId(this.quotesCountDown)).toExist();

    return await retryUntilTimeout(async () => {
      const numberOfQuotesText = await getWebElementText(this.numberOfQuotes);
      const providerList = await getWebElementsText(
        this.swapMainContainerWebElement,
        this.quoteCardProviderNameSelector,
      );

      if (!numberOfQuotesText.match(new RegExp(`^${providerList.length} quotes? found$`))) {
        throw new Error(
          `Quote count mismatch: UI shows "${numberOfQuotesText}" but found ${providerList.length} cards`,
        );
      }

      return providerList;
    }, 30000);
  }

  @Step("Check error message: $0")
  async checkErrorMessage(errorMessage: string) {
    const error = await getTextOfElement(this.deviceActionErrorDescriptionId);
    jestExpect(error).toContain(errorMessage);
  }

  @Step("Check first quote container infos")
  async checkFirstQuoteContainerInfos(providerList: string[]) {
    const provider: string = SwapProvider.getNameByUiName(providerList[0]);
    const baseProviderLocator = `quote-container-${provider}`;
    await waitWebElementByTestId(baseProviderLocator, { testIdSuffix: "-amount-label" });
    await tapWebElementByTestId(baseProviderLocator, { testIdSuffix: "-amount-label" });

    await detoxExpect(
      getWebElementByTestId(baseProviderLocator, { testIdSuffix: "-amount-label" }),
    ).toExist();
    await detoxExpect(
      getWebElementByTestId(baseProviderLocator, { testIdSuffix: "-fiatAmount-label" }),
    ).toExist();
    await detoxExpect(
      getWebElementByTestId(baseProviderLocator, { testIdSuffix: "-networkFees-heading" }),
    ).toExist();

    const extraFeesContainer = getWebElementByTestId(baseProviderLocator, {
      testIdSuffix: "extraFeesContainer",
    });
    await detoxExpect(extraFeesContainer).toExist();
    await detoxExpect(
      getWebElementByTestId(baseProviderLocator, { testIdSuffix: "-rate-infoIcon" }),
    ).toExist();

    if (
      provider === SwapProvider.ONE_INCH.name ||
      provider === SwapProvider.VELORA.name ||
      provider === SwapProvider.UNISWAP.name ||
      provider === SwapProvider.LIFI.name
    ) {
      await detoxExpect(
        getWebElementByTestId(baseProviderLocator, { testIdSuffix: "-slippage-infoIcon" }),
      ).toExist();
    }
    await this.checkExchangeButtonHasProviderName(providerList[0]);
  }

  @Step("Check exchange button has provider name: $0")
  async checkExchangeButtonHasProviderName(
    provider: string,
    allowApprovalCta = false,
  ): Promise<string> {
    const selector = this.providerExecuteButtonCss(provider);
    const button = getWebElementByCssSelector(selector);
    await waitWebElement(button);
    const actualButtonText =
      (await getWebElementsText(this.swapMainContainerWebElement, selector))[0] ?? "";
    const ctaVerbs = allowApprovalCta ? "Swap|Continue|Approve spending" : "Swap|Continue";
    jestExpect(actualButtonText).toMatch(
      new RegExp(`^(${ctaVerbs}) with ${escapeRegExp(provider)}$`, "i"),
    );
    return actualButtonText;
  }

  isApprovalRequired(buttonText: string, provider: string): boolean {
    return new RegExp(`^Approve spending with ${escapeRegExp(provider)}$`, "i").test(buttonText);
  }

  @Step('Check "Best Offer" corresponds to the best quote')
  async checkBestOffer(providerList: string[]) {
    if (providerList.length === 0) {
      throw new Error("checkBestOffer: expected a non-empty provider list");
    }
    // net = cent-rounded amount - cent-rounded fees, so each net carries ±0.01; two providers'
    // nets can therefore differ by up to 0.02 from rounding alone.
    const NET_ROUNDING_TOLERANCE = 0.02;

    await retryUntilTimeout(async () => {
      const quotes = [];
      for (const provider of providerList) {
        quotes.push(await this.getProviderQuote(provider));
      }

      const firstQuote = quotes[0];
      const bestNetValue = Math.max(...quotes.map(quoteNetValue));
      jestExpect(bestNetValue - quoteNetValue(firstQuote)).toBeLessThanOrEqual(
        NET_ROUNDING_TOLERANCE,
      );
    });
  }

  async getProviderQuote(provider: string) {
    const quoteText =
      (
        await getWebElementsText(
          this.swapMainContainerWebElement,
          this.providerQuoteContainerSelector(provider),
        )
      )[0] ?? "";
    const networkFeesIndex = quoteText.search(/Network Fees/i);
    const feesMatch =
      networkFeesIndex >= 0 ? /\$\s*(\d[\d,.]*)/.exec(quoteText.slice(networkFeesIndex)) : null;
    const usdAmountRegex = /\$\s*(\d[\d,.]*)/g;
    const usdAmounts = [];
    let usdAmountMatch: RegExpExecArray | null;

    while ((usdAmountMatch = usdAmountRegex.exec(quoteText)) !== null) {
      usdAmounts.push(usdAmountMatch[1]);
    }

    if (!feesMatch || usdAmounts.length === 0) {
      throw new Error(`No parsable quote found for provider ${provider}`);
    }

    const parseAmount = (amount: string) => Number.parseFloat(amount.replace(/,/g, ""));

    return {
      provider,
      fees: parseAmount(feesMatch[1]),
      rate: parseAmount(usdAmounts[usdAmounts.length - 1]),
    };
  }

  @Step("Verify swap amount error message match: $0")
  async verifySwapAmountErrorMessageIsCorrect(expectedMessage: string | RegExp) {
    await waitWebElementByTestId(this.fromAccountErrorId);
    const errorText: string = await getWebElementText(this.fromAccountErrorId);
    jestExpect(errorText).toMatch(expectedMessage);

    await this.expectQuotesButtonNotVisible();
  }

  @Step("Verify swap cross account error message match: $0")
  async verifySwapCrossAccountErrorMessageIsCorrect(expectedMessage: string | RegExp) {
    // Cross-account warnings render in the same from-account error slot as amount errors.
    await this.verifySwapAmountErrorMessageIsCorrect(expectedMessage);
  }

  @Step("Verify swap CTA banner displayed")
  async checkCtaBanner(quotesVisible: boolean) {
    const showDetailsLink = quotesVisible
      ? getWebElementByCssSelector(`.fixed [data-testid="${this.showDetailslink}"]`)
      : getWebElementByTestId(this.showDetailslink);
    await waitWebElement(showDetailsLink);
    await tapWebElementByElement(showDetailsLink);
    await waitWebElementByTestId(this.quotesContainerErrorIcon);
    await detoxExpect(getWebElementByTestId(this.insufficientFundsBuyButton)).toExist();
  }

  @Step("Click on swap max")
  async clickSwapMax() {
    await tapWebElementByTestId(this.swapMaxToggle);
    await retryUntilTimeout(async () => {
      const text = await getWebElementText(this.toAmountInput);
      if (!floatNumberRegex.test(text) || Number(text) === 0) {
        throw new Error(`Web Element "${this.toAmountInput}" has no quote yet (amount is "${text}")`);
      }
      return text;
    }, 10000);
  }

  @Step("Retrieve send currency amount value")
  async getAmountToSend() {
    return await getValueByWebTestId(this.fromAmountInput);
  }

  @Step("Retrieve receive currency amount value")
  async getAmountToReceive() {
    return await getWebElementText(this.toAmountInput);
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

  @Step("Check currency to swap from contains $0")
  async checkAssetFromContains(expectedAssetText: string) {
    const fromAccount: string = await getWebElementText(this.fromSelector);
    jestExpect(fromAccount).toContain(expectedAssetText);
  }

  @Step("Check currency to swap from matches account $0")
  async checkAssetFromMatchesAccount(account: Account) {
    const selectedAccountText: string = await getWebElementText(this.fromSelector);
    jestExpect(selectedAccountText).toContain(account.currency.ticker);
    await waitWebElementByTestId(this.fromAccountAccountNameTag);
    const accountNameText: string = await getWebElementText(this.fromAccountAccountNameTag);
    jestExpect(accountNameText).toContain(account.accountName);
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

  @Step("Check currency to swap to contains $0")
  async checkAssetToContains(expectedAssetText: string) {
    const assetTo: string = await getWebElementText(this.toSelector);
    if (expectedAssetText === "") {
      jestExpect(assetTo).toContain("Choose asset");
    } else {
      jestExpect(assetTo).toContain(expectedAssetText);
    }
  }

  @Step("Check currency to swap to matches account $0")
  async checkAssetToMatchesAccount(account: Account) {
    const selectedAccountTicker: string = await getWebElementText(this.toSelector);
    const expectedAccountName = account.parentAccount?.accountName ?? account.accountName;
    await waitWebElementByTestId(this.toAccountAccountNameTag);
    const selectedAccountNameTag: string = await getWebElementText(this.toAccountAccountNameTag);

    jestExpect(selectedAccountTicker).toContain(account.currency.ticker);
    jestExpect(selectedAccountNameTag).toContain(expectedAccountName);
  }

  @Step("Check Ledger Nano S not supported banner for $0")
  async checkLnsNotSupportedBanner(provider: string) {
    await retryUntilTimeout(async () => {
      const bannerText = await getWebElementsText(
        this.swapMainContainerWebElement,
        this.incompatibilityBannerPartnerSelector(provider),
      );
      jestExpect(bannerText.join(" ")).toMatch(this.lnsUnsupportedBannerPattern);
    }, 20000);
  }

  @Step("Select specific provider $0")
  async selectSpecificProvider(provider: string) {
    const providersList = await this.getProviderList();
    if (!providersList.includes(provider)) {
      throw new Error(`Provider "${provider}" not found in the list`);
    }
    const providerName = SwapProvider.getNameByUiName(provider);
    const providerTestId = this.specificQuoteCardProviderName(providerName);
    await waitWebElementByTestId(providerTestId);
    await tapWebElementByTestId(providerTestId);
  }

  @Step("Go to $0 live app")
  async goToProviderLiveApp(provider: string) {
    const button = getWebElementByCssSelector(this.providerExecuteButtonCss(provider));
    await detoxExpect(button).toExist();
    const actualButtonText = await app.swapLiveApp.checkExchangeButtonHasProviderName(provider);
    await app.swapLiveApp.tapExecuteSwap(provider);
    if (provider === "1inch" && actualButtonText.includes("Swap with")) {
      await app.swapLiveApp.tapExecuteSwapOnStepApproval();
      const summaryContinueButton = app.send.summaryContinueButton();
      await waitForElement(summaryContinueButton);
      await tapByElement(summaryContinueButton);
    }
  }

  @Step("Verify live app title contains $0")
  async verifyLiveAppTitle(expectedText: string) {
    const liveAppTitle = await getTextOfElement("live-app-title");
    jestExpect(liveAppTitle.toLowerCase()).toContain(expectedText.toLowerCase());
  }

  @Step("Expect reset allowance screen")
  async expectResetApprovalScreen() {
    await waitWebElementByTestId(this.revokeApprovalButton);
    await detoxExpect(getWebElementByTestId(this.revokeApprovalButton)).toExist();
  }

  @Step("Tap revoke approval button")
  async tapRevokeApprovalButton() {
    await waitForWebElementToBeEnabled(this.revokeApprovalButton);
    await tapWebElementByTestId(this.revokeApprovalButton);
  }

  @Step("Expect TwoStepApprovalScreen")
  async expectTwoStepApprovalScreen() {
    await waitWebElementByTestId(this.giveApprovalButton);
    await detoxExpect(getWebElementByTestId(this.giveApprovalButton)).toExist();
  }

  @Step("Tap give Approval button")
  async tapGiveApprovalButton() {
    await waitForWebElementToBeEnabled(this.giveApprovalButton);
    await tapWebElementByTestId(this.giveApprovalButton);
  }

  @Step("Tap Give Authorization button")
  async tapGiveAuthorizationButton() {
    await waitWebElementByTestId(this.signPermitButton, { timeout: APPROVAL_PROCESSING_TIMEOUT });
    await waitForWebElementToBeEnabled(this.signPermitButton);
    await tapWebElementByTestId(this.signPermitButton);
  }
}
