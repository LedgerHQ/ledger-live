import { Step } from "jest-allure2-reporter/api";
import { AccountType, getParentAccountName } from "@ledgerhq/live-e2e-shared/enum/Account";
import { BuySell, Fiat } from "@ledgerhq/live-e2e-shared/models/BuySell";
import { BuySellProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { pickRotatingProvider } from "@ledgerhq/live-e2e-shared/buySell";
import {
  extractGoToUrl,
  getExpectedQueryParams,
  urlMatchesProvider,
} from "@ledgerhq/live-e2e-shared/buySellHandoff";
import { openDeeplink, normalizeText } from "@e2e/helpers/commonHelpers";
import { getPtxHandoff } from "@e2e/bridge/server";
import { retryUntilTimeout } from "@e2e/utils/retry";

export default class BuySellPage {
  appContainerCssSelector = "#app-container";
  amountInputSectionBaseId = "amount-input-section";
  countryDrawerSearchInput = "countries-drawer-search-input";
  cryptoAccountSelector = "account-details";
  cryptoCurrencySelector = "crypto-amount-option-button";
  expandButtonId = "expand-button";
  fiatAmountOptionButtonId = "fiat-amount-option-button";
  fiatDrawer = "open-fiat-drawer";
  fiatDrawerInput = "fiat-drawer-search-input";
  formCta = "form-cta";
  openCountryDrawerButtonId = "open-country-drawer";
  paymentOptions = "payment-options";
  paymentSelector = "payment_selector";
  providersList = "providers_list";
  saveRegionFiatOptionsSelector = "save-region-and-fiat-options";
  providerTitleCssSelector = "[data-testid^='provider_title_'][data-testid$='_title_container']";

  currencyRow = (currencyId: string) => `currency-row-${currencyId}`;
  buyQuickAmountButtonId = (amount: "400" | "800" | "1600") => `buy-amount-button-${amount}`;
  sellPercentageButtonId = (pct: "25%" | "50%" | "75%" | "max") => pct;
  amountInputSectionId = () => `${this.amountInputSectionBaseId}-input`;
  countryListSelector = (locale: string) => `country-option-${locale.split("-")[1].toLowerCase()}`;
  currencyListSelector = (curr: string) => `fiat-option-${curr}`;
  provider = (name: string) => `provider_${name.toLowerCase()}`;

  @Step("Open page via deeplink {{{0}}}")
  async openViaDeeplink(page: "Buy" | "Sell") {
    await openDeeplink(page.toLowerCase());
    await waitForElementById(app.common.walletApiWebview, 60000, { checkVisibility: false });
  }

  // App-side CAL lookup for the Buy screen's currencies (700+ ids) measures 60-90s;
  // 60s flakes on that alone. Latency is tracked separately, not fixed here.
  cryptoCurrencySelectorTimeout = 120000;

  @Step("Expect Buy screen to be visible")
  async expectBuyScreenToBeVisible() {
    await waitWebElementByTestId(this.cryptoCurrencySelector, {
      timeout: this.cryptoCurrencySelectorTimeout,
    });
    await detoxExpect(getWebElementsByIdAndText("", "You will pay")).toExist();
    await detoxExpect(getWebElementByTestId(this.amountInputSectionId())).toExist();
    await detoxExpect(getWebElementByTestId(this.buyQuickAmountButtonId("400"))).toExist();
    await detoxExpect(getWebElementByTestId(this.buyQuickAmountButtonId("800"))).toExist();
    await detoxExpect(getWebElementByTestId(this.buyQuickAmountButtonId("1600"))).toExist();
    await detoxExpect(getWebElementByTestId(this.fiatAmountOptionButtonId)).toExist();
  }

  @Step("Expect Sell screen to be visible")
  async expectSellScreenToBeVisible() {
    await waitWebElementByTestId(this.cryptoCurrencySelector, {
      timeout: this.cryptoCurrencySelectorTimeout,
    });
    await detoxExpect(getWebElementsByIdAndText("", "You will sell")).toExist();
    await detoxExpect(getWebElementByTestId(this.amountInputSectionId())).toExist();
    await detoxExpect(getWebElementByTestId(this.sellPercentageButtonId("25%"))).toExist();
    await detoxExpect(getWebElementByTestId(this.sellPercentageButtonId("50%"))).toExist();
    await detoxExpect(getWebElementByTestId(this.sellPercentageButtonId("75%"))).toExist();
    await detoxExpect(getWebElementByTestId(this.sellPercentageButtonId("max"))).toExist();
  }

  @Step("Select currency {{{0}}}")
  async selectCurrency(currencyId: string) {
    const id = this.currencyRow(currencyId);
    await waitForElementById(id);
    await tapById(id);
  }

  @Step("Choose crypto asset if not selected {{{0.accountName}}}")
  async chooseAssetIfNotSelected(account: AccountType) {
    await tapWebElementByTestId(this.cryptoCurrencySelector);
    await app.modularDrawer.selectAsset(account);
    jestExpect(await getWebElementText(this.cryptoCurrencySelector)).toBe(account.currency.ticker);
    jestExpect(await getWebElementText(this.cryptoAccountSelector)).toBe(
      `${getParentAccountName(account)}${account.tokenType ? ` (${account.currency.ticker})` : ""}`,
    );
  }

  @Step("Choose country if not selected {{{0.locale}}}")
  async chooseCountryIfNotSelected(fiat: Fiat) {
    await tapWebElementByTestId(this.fiatAmountOptionButtonId);
    await tapWebElementByTestId(this.openCountryDrawerButtonId);
    await typeTextByWebTestId(this.countryDrawerSearchInput, fiat.locale.split("-")[1]);
    await tapWebElementByTestId(this.countryListSelector(fiat.locale));
    await tapWebElementByTestId(this.fiatDrawer);
    await typeTextByWebTestId(this.fiatDrawerInput, fiat.currencyTicker);
    await tapWebElementByTestId(this.currencyListSelector(fiat.currencyTicker));
    await tapWebElementByTestId(this.saveRegionFiatOptionsSelector);
    jestExpect(await getWebElementText(this.fiatAmountOptionButtonId)).toBe(fiat.currencyTicker);
  }

  @Step("Verify quick amount buttons functionality")
  async verifyQuickAmountButtonsFunctionality() {
    const amountTests = [
      { button: "400", expected: "400" },
      { button: "800", expected: "800" },
      { button: "1600", expected: "1,600" },
    ] as const;

    for (const { button, expected } of amountTests) {
      await tapWebElementByTestId(this.buyQuickAmountButtonId(button));
      const value = await getValueByWebTestId(this.amountInputSectionId());
      jestExpect(normalizeText(value)).toBe(expected);
    }
  }

  @Step("Tap sell percentage button {{{0}}}")
  async tapSellPercentageButton(percentage: "25%" | "50%" | "75%" | "max") {
    await tapWebElementByTestId(this.sellPercentageButtonId(percentage));
  }

  @Step("Set amount to pay {{{0}}}")
  async setAmountToPay(amount: string) {
    await typeTextByWebTestId(this.amountInputSectionId(), amount);
  }

  @Step("Tap see quotes cta")
  async tapSeeQuotes() {
    await waitForWebElementToBeEnabled(this.formCta);
    const text = await getWebElementText(this.formCta);
    jestExpect(normalizeText(text).toLowerCase()).toBe("see quotes");
    await tapWebElementByTestId(this.formCta);
  }

  @Step("Tap {{{1}}} cta for {{{0}}}")
  async tapBuySellWithCta(provider: string, page: "Buy" | "Sell") {
    await waitForWebElementToBeEnabled(this.formCta);
    const text = await getWebElementText(this.formCta);
    jestExpect(normalizeText(text)).toBe(`${page} with ${provider}`);
    await tapWebElementByTestId(this.formCta);
  }

  @Step("Select payment method {{{0}}}")
  async selectPaymentMethod(paymentMethod: string) {
    await tapWebElementByTestId(this.paymentSelector);
    await detoxExpect(getWebElementByTestId(this.paymentOptions)).toExist();
    await tapWebElementByTestId(paymentMethod);
    const currentPaymentMethod = await getWebElementText(this.paymentSelector);
    jestExpect(normalizeText(currentPaymentMethod).toLowerCase()).toContain(paymentMethod);
  }

  @Step("Get available providers")
  async getAvailableProviders(): Promise<string[]> {
    await waitWebElementByTestId(this.providersList);
    const expandButton = await waitWebElementByTestId(this.expandButtonId, {
      timeout: 2000,
      throwOnTimeout: false,
    });
    if (expandButton) {
      await tapWebElementByTestId(this.expandButtonId);
    }
    const providerNames = await getWebElementsText(
      getWebElementByCssSelector(this.appContainerCssSelector),
      this.providerTitleCssSelector,
    );
    return providerNames;
  }

  @Step("Select rotating provider")
  async selectRotatingProvider(): Promise<BuySellProvider> {
    const availableProviders = await this.getAvailableProviders();
    const selected = pickRotatingProvider(availableProviders);

    await scrollToWebElement(getWebElementByTestId(this.provider(selected.name)));
    await tapWebElementByTestId(this.provider(selected.name));
    return selected;
  }

  @Step("Select provider {{{0}}}")
  async selectProvider(provider: string) {
    await waitWebElementByTestId(this.providersList);
    const expandButton = await waitWebElementByTestId(this.expandButtonId, {
      timeout: 2000,
      throwOnTimeout: false,
    });
    if (expandButton) {
      await tapWebElementByTestId(this.expandButtonId);
    }
    await scrollToWebElement(getWebElementByTestId(this.provider(provider)));
    await tapWebElementByTestId(this.provider(provider));
  }

  /**
   * Asserts the handoff Ledger Live actually owns: the `goToURL` the app hands to the
   * partner, and its query parameters. Deliberately does NOT wait on the partner's own
   * page to load or render - that page is third-party and uncontrolled, and rendering it
   * on the Android CI emulator's software renderer takes the emulator down mid-test.
   * Mirrors e2e/desktop, which asserts the same handoff out of `webviewUrlHistory`.
   */
  @Step("Verify provider handoff URL and query parameters {{{0.uiName}}}")
  async verifyProviderHandoff(provider: BuySellProvider, buySell: BuySell) {
    const rawHandoffUrl = await retryUntilTimeout(async () => {
      const url = await getPtxHandoff();
      if (!url) throw new Error("No Buy/Sell handoff URL recorded by the app yet");
      return url;
    }, 30000);

    const partnerUrl = new URL(extractGoToUrl(rawHandoffUrl));

    if (!urlMatchesProvider(partnerUrl.href, provider)) {
      throw new Error(
        `Provider "${provider.uiName}" should appear in the handoff URL: ${partnerUrl.href}`,
      );
    }

    const params = Object.fromEntries(
      Array.from(partnerUrl.searchParams).map(([key, value]) => [key.toLowerCase(), value]),
    );
    for (const [key, expected] of Object.entries(getExpectedQueryParams(provider, buySell))) {
      const actual = params[key];
      if (actual === undefined) {
        throw new Error(`Query param "${key}" not found in handoff URL: ${partnerUrl.href}`);
      }
      jestExpect(actual.toLowerCase()).toContain(expected);
    }
  }

  @Step("Handle buy flow with {{{1}}}")
  async handleBuyFlow(buySell: BuySell, paymentMethod: string, skipQuickAmountVerify?: boolean) {
    await this.expectBuyScreenToBeVisible();
    await this.chooseAssetIfNotSelected(buySell.crypto);
    if (!skipQuickAmountVerify) {
      await this.verifyQuickAmountButtonsFunctionality();
    }
    await this.setAmountToPay(buySell.amount);
    await this.chooseCountryIfNotSelected(buySell.fiat);
    await this.tapSeeQuotes();
    await this.selectPaymentMethod(paymentMethod);
    const selectedProvider = await this.selectRotatingProvider();
    await this.tapBuySellWithCta(selectedProvider.uiName, buySell.operation);
    await this.verifyProviderHandoff(selectedProvider, buySell);
  }

  /**
   * The amount is deliberately not a parameter: this flow taps the 75% button, so the
   * figure handed to the partner is whatever the UI resolved. Passing one in would only
   * invite a caller to believe it was typed.
   */
  @Step("Handle sell flow {{{1}}}")
  async handleSellFlow(
    buySell: Omit<BuySell, "amount">,
    paymentMethod: string,
    provider: BuySellProvider,
  ) {
    await this.expectSellScreenToBeVisible();
    await this.chooseAssetIfNotSelected(buySell.crypto);
    await this.tapSellPercentageButton("75%");
    await this.chooseCountryIfNotSelected(buySell.fiat);
    const selectedAmount = normalizeText(await getValueByWebTestId(this.amountInputSectionId()));
    await this.tapSeeQuotes();
    await this.selectPaymentMethod(paymentMethod);
    await this.selectProvider(provider.name);
    await this.tapBuySellWithCta(provider.uiName, buySell.operation);
    await this.verifyProviderHandoff(provider, { ...buySell, amount: selectedAmount });
  }
}
