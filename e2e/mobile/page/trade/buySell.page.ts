import { Step } from "jest-allure2-reporter/api";
import { AccountType, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { BuySell, Fiat } from "@ledgerhq/live-common/e2e/models/BuySell";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { openDeeplink, normalizeText, isIos } from "../../helpers/commonHelpers";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";

export default class BuySellPage {
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

  currencyRow = (currencyId: string) => `currency-row-${currencyId}`;
  buyQuickAmountButtonId = (amount: "400" | "800" | "1600") => `buy-amount-button-${amount}`;
  sellPercentageButtonId = (pct: "25%" | "50%" | "75%" | "max") => pct;
  amountInputSectionId = () => `${this.amountInputSectionBaseId}-input`;
  countryListSelector = (locale: string) => `country-option-${locale.split("-")[1].toLowerCase()}`;
  currencyListSelector = (curr: string) => `fiat-option-${curr}`;
  provider = (name: string) => `provider_${name.toLowerCase()}`;

  @Step("Open page via deeplink")
  async openViaDeeplink(page: "Buy" | "Sell") {
    await openDeeplink(page.toLowerCase());
    await waitForElementById(app.common.walletApiWebview, 60000, { checkVisibility: false });
  }

  @Step("Expect Buy screen to be visible")
  async expectBuyScreenToBeVisible() {
    await waitWebElementByTestId(this.cryptoCurrencySelector);
    await detoxExpect(getWebElementsByIdAndText("", "You will pay")).toExist();
    await detoxExpect(getWebElementByTestId(this.amountInputSectionId())).toExist();
    await detoxExpect(getWebElementByTestId(this.buyQuickAmountButtonId("400"))).toExist();
    await detoxExpect(getWebElementByTestId(this.buyQuickAmountButtonId("800"))).toExist();
    await detoxExpect(getWebElementByTestId(this.buyQuickAmountButtonId("1600"))).toExist();
    await detoxExpect(getWebElementByTestId(this.fiatAmountOptionButtonId)).toExist();
  }

  @Step("Expect Sell screen to be visible")
  async expectSellScreenToBeVisible() {
    await waitWebElementByTestId(this.cryptoCurrencySelector);
    await detoxExpect(getWebElementsByIdAndText("", "You will sell")).toExist();
    await detoxExpect(getWebElementByTestId(this.amountInputSectionId())).toExist();
    await detoxExpect(getWebElementByTestId(this.sellPercentageButtonId("25%"))).toExist();
    await detoxExpect(getWebElementByTestId(this.sellPercentageButtonId("50%"))).toExist();
    await detoxExpect(getWebElementByTestId(this.sellPercentageButtonId("75%"))).toExist();
    await detoxExpect(getWebElementByTestId(this.sellPercentageButtonId("max"))).toExist();
  }

  @Step("Select currency")
  async selectCurrency(currencyId: string) {
    const id = this.currencyRow(currencyId);
    await waitForElementById(id);
    await tapById(id);
  }

  @Step("Choose crypto asset if not selected")
  async chooseAssetIfNotSelected(account: AccountType) {
    await tapWebElementByTestId(this.cryptoCurrencySelector);
    if (await app.modularDrawer.isFlowEnabled("live_app")) {
      isIos()
        ? await app.modularDrawer.selectAssetBuySellIosWorkaround(account)
        : await app.modularDrawer.selectAsset(account);
    } else {
      await this.selectCurrency(account.currency.id);
      await app.common.selectAccount(account);
    }
    jestExpect(await getWebElementText(this.cryptoCurrencySelector)).toBe(account.currency.ticker);
    jestExpect(await getWebElementText(this.cryptoAccountSelector)).toBe(
      `${getParentAccountName(account)}${account.tokenType ? ` (${account.currency.ticker})` : ""}`,
    );
  }

  @Step("Choose country if not selected")
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

  @Step("Tap sell percentage button")
  async tapSellPercentageButton(percentage: "25%" | "50%" | "75%" | "max") {
    await tapWebElementByTestId(this.sellPercentageButtonId(percentage));
  }

  @Step("Set amount to pay")
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

  @Step("Tap buy/sell cta")
  async tapBuySellWithCta(provider: string, page: "Buy" | "Sell") {
    await waitForWebElementToBeEnabled(this.formCta);
    const text = await getWebElementText(this.formCta);
    jestExpect(normalizeText(text)).toBe(`${page} with ${provider}`);
    await tapWebElementByTestId(this.formCta);
  }

  @Step("Select payment method")
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
    const expandButton = await waitWebElementByTestId(this.expandButtonId, 2000, false);
    if (expandButton) {
      await tapWebElementByTestId(this.expandButtonId);
    }
    const providerNames = await getWebElementsText(
      '[data-testid^="provider_title_"][data-testid$="_title_container"]',
    );
    return providerNames;
  }

  @Step("Select random provider")
  async selectRandomProvider(): Promise<string> {
    const providers = await this.getAvailableProviders();
    if (providers.length === 0) {
      throw new Error("No providers available");
    }
    const randomIndex = Math.floor(Math.random() * providers.length);
    const selected = providers[randomIndex];
    const testIdName = Provider.getNameByUiName(selected);
    if (!testIdName) {
      throw new Error(`Unknown provider UI name: "${selected}"`);
    }

    await scrollToWebElement(getWebElementByTestId(this.provider(testIdName)));
    await tapWebElementByTestId(this.provider(testIdName));
    return selected;
  }

  @Step("Select provider")
  async selectProvider(provider: string) {
    await waitWebElementByTestId(this.providersList);
    const expandButton = await waitWebElementByTestId(this.expandButtonId, 2000, false);
    if (expandButton) {
      await tapWebElementByTestId(this.expandButtonId);
    }
    await scrollToWebElement(getWebElementByTestId(this.provider(provider)));
    await tapWebElementByTestId(this.provider(provider));
  }

  @Step("Verify provider page loaded with correct URL")
  async verifyProviderPageLoadedWithCorrectUrl(provider: string) {
    try {
      const normalizedProvider = provider.toLowerCase().replace(/\s/g, "");
      const currentUrl = await waitForCurrentWebviewUrlToContain(normalizedProvider);
      jestExpect(currentUrl.toLowerCase()).toContain(normalizedProvider);
    } catch (error) {
      throw new Error(`Provider page verification failed: ${sanitizeError(error)}`);
    }
  }

  @Step("Handle buy flow")
  async handleBuyFlow(buySell: BuySell, paymentMethod: string) {
    await this.expectBuyScreenToBeVisible();
    await this.chooseAssetIfNotSelected(buySell.crypto);
    await this.verifyQuickAmountButtonsFunctionality();
    await this.setAmountToPay(buySell.amount);
    await this.chooseCountryIfNotSelected(buySell.fiat);
    await this.tapSeeQuotes();
    await this.selectPaymentMethod(paymentMethod);
    const selectedProvider = await this.selectRandomProvider();
    await this.tapBuySellWithCta(selectedProvider, buySell.operation);
    await this.verifyProviderPageLoadedWithCorrectUrl(selectedProvider);
  }

  @Step("Handle sell flow")
  async handleSellFlow(buySell: BuySell, paymentMethod: string, provider: Provider) {
    await this.expectSellScreenToBeVisible();
    await this.chooseAssetIfNotSelected(buySell.crypto);
    await this.tapSellPercentageButton("50%");
    await this.chooseCountryIfNotSelected(buySell.fiat);
    await this.tapSeeQuotes();
    await this.selectPaymentMethod(paymentMethod);
    await this.selectProvider(provider.name);
    await this.tapBuySellWithCta(provider.uiName, buySell.operation);
    await this.verifyProviderPageLoadedWithCorrectUrl(provider.uiName);
  }
}
