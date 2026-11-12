import { Step } from "jest-allure2-reporter/api";
import { TIMEOUT } from "@e2e/utils/timeouts";
import { AccountType, getParentAccountName } from "@ledgerhq/live-e2e-shared/enum/Account";
import { BuySell, Fiat } from "@ledgerhq/live-e2e-shared/models/BuySell";
import { BuySellProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { pickRotatingProvider } from "@ledgerhq/live-e2e-shared/buySell";
import {
  extractGoToUrl,
  getExpectedQueryParams,
  urlMatchesProvider,
} from "@ledgerhq/live-e2e-shared/buySellHandoff";
import { openDeeplink, normalizeText, isAndroid } from "@e2e/helpers/commonHelpers";
import { getPtxHandoff } from "@e2e/bridge/server";
import { retryUntilTimeout } from "@e2e/utils/retry";
import { byId } from "@e2e/helpers/elements/native";
import { webByCss, webById, webByXPath } from "@e2e/helpers/elements/web";

export default class BuySellPage {
  private readonly appContainer = webByCss("#app-container");
  private readonly providerTitleCssSelector =
    "[data-testid^='provider_title_'][data-testid$='_title_container']";

  private readonly closeButton = webById("icon_button_close");
  private readonly amountInputSection = webById("amount-input-section-input");
  private readonly countryDrawerSearchInput = webById("countries-drawer-search-input");
  private readonly cryptoAccountSelector = webById("account-details");
  private readonly cryptoCurrencySelector = webById("crypto-amount-option-button");
  private readonly expandButton = webById("expand-button");
  private readonly fiatAmountOptionButton = webById("fiat-amount-option-button");
  private readonly fiatDrawer = webById("open-fiat-drawer");
  private readonly fiatDrawerInput = webById("fiat-drawer-search-input");
  private readonly formCta = webById("form-cta");
  private readonly openCountryDrawerButton = webById("open-country-drawer");
  private readonly paymentOptions = webById("payment-options");
  private readonly paymentSelector = webById("payment_selector");
  private readonly providersList = webById("providers_list");
  private readonly saveRegionFiatOptionsSelector = webById("save-region-and-fiat-options");
  private readonly youWillPayText = webByXPath(`//span[text()="You will pay"]`);
  private readonly youWillSellText = webByXPath(`//span[text()="You will sell"]`);

  private readonly currencyRow = (currencyId: string) => byId(`currency-row-${currencyId}`);
  private readonly buyQuickAmountButton = (amount: "400" | "800" | "1600") =>
    webById(`buy-amount-button-${amount}`);
  private readonly sellPercentageButton = (pct: "25%" | "50%" | "75%" | "max") => webById(pct);
  private readonly countryListSelector = (locale: string) =>
    webById(`country-option-${locale.split("-")[1].toLowerCase()}`);
  private readonly currencyListSelector = (curr: string) => webById(`fiat-option-${curr}`);
  private readonly paymentMethodOption = (paymentMethod: string) => webById(paymentMethod);
  private readonly provider = (name: string) => webById(`provider_${name.toLowerCase()}`);

  @Step("Open page via deeplink {{{0}}}")
  async openViaDeeplink(page: "Buy" | "Sell") {
    // The deeplink into the live app keeps the network busy, so with synchronization on Detox
    // never sees the app idle and the webview wait hangs instead of timing out.
    await app.common.disableSynchronization();
    try {
      await openDeeplink(page.toLowerCase());
      await app.common.waitForWalletApiWebview(TIMEOUT.xxxlarge);
    } finally {
      await app.common.enableSynchronization();
    }
  }

  // App-side CAL lookup for the Buy screen's currencies (700+ ids) measures 60-90s;
  // 60s flakes on that alone. Latency is tracked separately, not fixed here.
  cryptoCurrencySelectorTimeout = TIMEOUT.xxxlarge;

  @Step("Close the Buy screen")
  async closeBuyScreen() {
    await this.closeButton.tap();
  }

  @Step("Expect Buy screen to be visible")
  async expectBuyScreenToBeVisible() {
    await this.cryptoCurrencySelector.waitVisible(this.cryptoCurrencySelectorTimeout);
    await this.youWillPayText.expectExist();
    await this.amountInputSection.expectExist();
    await this.buyQuickAmountButton("400").expectExist();
    await this.buyQuickAmountButton("800").expectExist();
    await this.buyQuickAmountButton("1600").expectExist();
    await this.fiatAmountOptionButton.expectExist();
  }

  @Step("Expect Sell screen to be visible")
  async expectSellScreenToBeVisible() {
    await this.cryptoCurrencySelector.waitVisible(this.cryptoCurrencySelectorTimeout);
    await this.youWillSellText.expectExist();
    await this.amountInputSection.expectExist();
    await this.sellPercentageButton("25%").expectExist();
    await this.sellPercentageButton("50%").expectExist();
    await this.sellPercentageButton("75%").expectExist();
    await this.sellPercentageButton("max").expectExist();
  }

  @Step("Select currency {{{0}}}")
  async selectCurrency(currencyId: string) {
    await this.currencyRow(currencyId).tap();
  }

  @Step("Choose crypto asset if not selected {{{0.accountName}}}")
  async chooseAssetIfNotSelected(account: AccountType) {
    await this.cryptoCurrencySelector.tap();
    await app.modularDrawer.selectAsset(account);
    await this.cryptoCurrencySelector.expectText(account.currency.ticker);
    await this.cryptoAccountSelector.expectText(
      `${getParentAccountName(account)}${account.tokenType ? ` (${account.currency.ticker})` : ""}`,
    );
  }

  @Step("Choose country if not selected {{{0.locale}}}")
  async chooseCountryIfNotSelected(fiat: Fiat) {
    await this.fiatAmountOptionButton.tap();
    await this.openCountryDrawerButton.tap();
    await this.countryDrawerSearchInput.replaceText(fiat.locale.split("-")[1]);
    await this.countryListSelector(fiat.locale).tap();
    await this.fiatDrawer.tap();
    await this.fiatDrawerInput.replaceText(fiat.currencyTicker);
    await this.currencyListSelector(fiat.currencyTicker).tap();
    await this.saveRegionFiatOptionsSelector.tap();
    await this.fiatAmountOptionButton.expectText(fiat.currencyTicker);
  }

  @Step("Verify quick amount buttons functionality")
  async verifyQuickAmountButtonsFunctionality() {
    const amountTests = [
      { button: "400", expected: "400" },
      { button: "800", expected: "800" },
      { button: "1600", expected: "1,600" },
    ] as const;

    for (const { button, expected } of amountTests) {
      await this.buyQuickAmountButton(button).tap();
      await this.amountInputSection.expectValue(expected, { normaliseWhitespace: true });
    }
  }

  @Step("Tap sell percentage button {{{0}}}")
  async tapSellPercentageButton(percentage: "25%" | "50%" | "75%" | "max") {
    await this.sellPercentageButton(percentage).tap();
  }

  @Step("Set amount to pay {{{0}}}")
  async setAmountToPay(amount: string) {
    await this.amountInputSection.replaceText(amount);
  }

  @Step("Tap see quotes cta")
  async tapSeeQuotes() {
    await this.formCta.waitEnabled();
    await this.formCta.expectText("see quotes", { normaliseWhitespace: true, ignoreCase: true });
    await this.formCta.tap();
  }

  @Step("Tap {{{1}}} cta for {{{0}}}")
  async tapBuySellWithCta(provider: string, page: "Buy" | "Sell") {
    await this.formCta.waitEnabled();
    await this.formCta.expectText(`${page} with ${provider}`, { normaliseWhitespace: true });
    await this.formCta.tap();
  }

  @Step("Select payment method {{{0}}}")
  async selectPaymentMethod(paymentMethod: string) {
    await this.paymentSelector.tap();
    await this.paymentOptions.expectExist();
    await this.paymentMethodOption(paymentMethod).tap();
    await this.paymentSelector.expectText(paymentMethod, {
      normaliseWhitespace: true,
      ignoreCase: true,
      containing: true,
    });
  }

  @Step("Get available providers")
  async getAvailableProviders(): Promise<string[]> {
    await this.providersList.waitVisible();
    if (await this.expandButton.isVisible(TIMEOUT.xsmall)) {
      await this.expandButton.tap();
    }

    return await this.appContainer.getChildTexts(this.providerTitleCssSelector);
  }

  @Step("Select rotating provider")
  async selectRotatingProvider(): Promise<BuySellProvider> {
    const availableProviders = await this.getAvailableProviders();
    // Selecting Banxa segfaults the Android CI emulator's renderer (QAA-1509).
    const selected = pickRotatingProvider(
      isAndroid()
        ? availableProviders.filter(uiName => uiName !== BuySellProvider.BANXA.uiName)
        : availableProviders,
    );
    await this.provider(selected.name).scrollTo();
    await this.provider(selected.name).tap();
    return selected;
  }

  @Step("Select provider {{{0}}}")
  async selectProvider(provider: string) {
    await this.providersList.waitVisible();
    if (await this.expandButton.isVisible(TIMEOUT.xsmall)) {
      await this.expandButton.tap();
    }
    await this.provider(provider).scrollTo();
    await this.provider(provider).tap();
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
    }, TIMEOUT.xlarge);

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
    const selectedAmount = normalizeText(await this.amountInputSection.getValue());
    await this.tapSeeQuotes();
    await this.selectPaymentMethod(paymentMethod);
    await this.selectProvider(provider.name);
    await this.tapBuySellWithCta(provider.uiName, buySell.operation);
    await this.verifyProviderHandoff(provider, { ...buySell, amount: selectedAmount });
  }
}
