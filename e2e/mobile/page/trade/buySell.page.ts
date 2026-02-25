import { Step } from "jest-allure2-reporter/api";
import { AccountType, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fiat } from "@ledgerhq/live-common/lib/e2e/models/BuySell";
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
  amountInputSectionId = () => `${this.amountInputSectionBaseId}-input`;
  countryListSelector = (locale: string) => `country-option-${locale.split("-")[1].toLowerCase()}`;
  currencyListSelector = (curr: string) => `fiat-option-${curr}`;
  provider = (name: string) => `provider_${name.toLowerCase()}`;

  @Step("Open page via deeplink")
  async openViaDeeplink(page: "Buy" | "Sell") {
    await openDeeplink(page.toLowerCase());
    await waitForElementById(app.common.walletApiWebview);
    await waitWebElementByTestId(this.cryptoCurrencySelector);
  }

  @Step("Expect Buy / Sell screen to be visible")
  async expectBuySellScreenToBeVisible(page: "Buy" | "Sell") {
    await waitWebElementByTestId(this.cryptoCurrencySelector);
    await detoxExpect(
      getWebElementsByIdAndText("", page === "Buy" ? "You will pay" : "You will sell"),
    ).toExist();
    await detoxExpect(getWebElementByTestId(this.amountInputSectionId())).toExist();
    await detoxExpect(getWebElementByTestId(this.buyQuickAmountButtonId("400"))).toExist();
    await detoxExpect(getWebElementByTestId(this.buyQuickAmountButtonId("800"))).toExist();
    await detoxExpect(getWebElementByTestId(this.buyQuickAmountButtonId("1600"))).toExist();
    await detoxExpect(getWebElementByTestId(this.fiatAmountOptionButtonId)).toExist();
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
      const currentUrl = await waitForCurrentWebviewUrlToContain(provider.toLowerCase());
      jestExpect(currentUrl.toLowerCase()).toContain(provider.toLowerCase());
    } catch (error) {
      throw new Error(`Provider page verification failed: ${sanitizeError(error)}`);
    }
  }
}
