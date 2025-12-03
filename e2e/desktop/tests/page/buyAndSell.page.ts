import { step } from "../misc/reporters/step";
import { WebViewAppPage } from "./webViewApp.page";
import { AccountType, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { BuySell, Fiat } from "@ledgerhq/live-common/e2e/models/BuySell";
import { expect } from "@playwright/test";
import { ChooseAssetDrawer } from "./drawer/choose.asset.drawer";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";
import { doubleDecodeGoToURL } from "../utils/urlUtils";
import { getAccountAddressesFromAppJson } from "../utils/getAccountAddressesUtils";
import { waitFor } from "../utils/waitFor";
import { ModularDrawer } from "./drawer/modular.drawer";

interface ProviderConfig {
  buyParams: Record<string, (buySell: BuySell) => string | number>;
  sellParams: Record<string, (buySell: BuySell) => string | number>;
  addressParam: string;
  parseAddress?: (value: string) => string;
}

export class BuyAndSellPage extends WebViewAppPage {
  private navigationTabs = "navigation-tabs";
  private cryptoCurrencySelectorLabel = "account-details";
  private cryptoCurrencySelector = "crypto-amount-option-button";
  private fiatOptionSelector = "fiat-amount-option-button";
  private tabTestId = (name: string) => `${name.toLowerCase()}-tab`;
  private amountInputSection = "amount-input-section-input";
  private formCta = "form-cta";
  private paymentSelector = "payment_selector";
  private providersList = "providers_list";
  private provider = (name: string) => `provider_${name.toLowerCase()}`;
  private infoBox = "info-box";
  private countryDrawer = "open-country-drawer";
  private countryDrawerSearchInput = "countries-drawer-search-input";
  private countryListSelector = (locale: string) => `country-option-${locale.slice(0, 2)}`;
  private currencyListSelector = (curr: string) => `fiat-option-${curr}`;
  private fiatDrawer = "open-fiat-drawer";
  private fiatDrawerInput = "fiat-drawer-search-input";
  private saveRegionFiatOptionsSelector = "save-region-and-fiat-options";
  private showMoreQuotes = "SHOW MORE QUOTES";

  private chooseAssetDrawer = new ChooseAssetDrawer(this.page);
  private modularDrawer = new ModularDrawer(this.page);

  private standardSellParams: Record<string, (buySell: BuySell) => string | number> = {
    cryptoAmount: buySell => buySell.amount,
    cryptoCurrency: buySell => buySell.crypto.currency.ticker,
    fiatCurrency: buySell => buySell.fiat.currencyTicker,
  };

  private providerConfigs: Record<string, ProviderConfig> = {
    [Provider.MOONPAY.uiName]: {
      buyParams: {
        baseCurrencyAmount: buySell => buySell.amount,
        currencyCode: buySell => buySell.crypto.currency.ticker,
        baseCurrencyCode: buySell => buySell.fiat.currencyTicker,
      },
      sellParams: this.standardSellParams,
      addressParam: "walletaddress",
    },
    [Provider.TRANSAK.uiName]: {
      buyParams: {
        fiatAmount: buySell => buySell.amount,
        cryptoCurrencyCode: buySell => buySell.crypto.currency.ticker,
        fiatCurrency: buySell => buySell.fiat.currencyTicker,
      },
      sellParams: this.standardSellParams,
      addressParam: "walletaddress",
    },
    [Provider.COINBASE.uiName]: {
      buyParams: {
        presetFiatAmount: buySell => buySell.amount,
        defaultAsset: buySell => buySell.crypto.currency.ticker,
        fiatCurrency: buySell => buySell.fiat.currencyTicker,
      },
      sellParams: this.standardSellParams,
      addressParam: "destinationwallets",
      parseAddress: (value: string) => {
        const wallets = JSON.parse(decodeURIComponent(value)) as Array<{
          address: string;
          blockchains: string[];
        }>;
        if (!wallets[0]?.address) {
          throw new Error("No address found in destinationwallets");
        }
        return wallets[0].address.toLowerCase();
      },
    },
  };

  @step("Expect Buy / Sell screen to be visible")
  async verifyBuySellScreenIsVisible() {
    await this.verifyElementIsVisible(this.navigationTabs);
  }

  @step("Expect $0 tab to be selected")
  async verifySelectedTab(operation: string) {
    await this.verifyElementIsSelected(this.tabTestId(operation));
  }

  @step("Select $0 tab")
  async selectTab(operation: string) {
    await this.clickElement(this.tabTestId(operation));
    await this.verifyElementIsSelected(this.tabTestId(operation));
  }

  @step("Choose crypto asset if not selected")
  async chooseAssetIfNotSelected(account: AccountType) {
    if (await this.isCorrectAssetAlreadySelected(account)) {
      return;
    }

    await this.clickElement(this.cryptoCurrencySelector);
    await this.selectAssetInDrawer(account);
  }

  private async isCorrectAssetAlreadySelected(account: AccountType): Promise<boolean> {
    const selectedTicker = await this.getWebViewElementByTestId(this.cryptoCurrencySelector);
    const selectedTickerText = (await selectedTicker.textContent()) || "";

    return (
      selectedTickerText.includes(account.currency.ticker) ||
      selectedTickerText.includes(account.currency.name)
    );
  }

  private async selectAssetInDrawer(account: AccountType) {
    const isModularDrawer = await this.modularDrawer.isModularAssetsDrawerVisible();
    if (isModularDrawer) {
      await this.selectAssetInModularDrawer(account);
    } else {
      await this.selectAssetInLegacyDrawer(account);
    }
  }

  private async selectAssetInModularDrawer(account: AccountType) {
    await this.modularDrawer.validateAssetsDrawerItems();
    await this.modularDrawer.selectAssetByTickerAndName(account.currency);
    await this.modularDrawer.selectNetwork(account.currency);
    await this.modularDrawer.selectAccountByName(account);
  }

  private async selectAssetInLegacyDrawer(account: AccountType) {
    const networkName = account.parentAccount?.currency.name;

    await this.chooseAssetDrawer.chooseFromAsset(account.currency.name, networkName);
    await this.chooseAssetDrawer.selectAccountByName(account);
  }

  @step("Change region and currency")
  async changeRegionAndCurrency(fiat: Fiat) {
    await this.clickElement(this.fiatOptionSelector);
    await this.setRegion(fiat.locale);
    await this.setCurrency(fiat.currencyTicker);
    await this.clickElement(this.saveRegionFiatOptionsSelector);
  }

  @step("Select region $0")
  async setRegion(locale: string) {
    await this.clickElement(this.countryDrawer);
    await this.setValue(this.countryDrawerSearchInput, locale.slice(3, 5));
    await this.clickElement(this.countryListSelector(locale));
  }

  @step("Select currency $0")
  async setCurrency(currencyTicker: string) {
    await this.clickElement(this.fiatDrawer);
    await this.setValue(this.fiatDrawerInput, currencyTicker);
    await this.clickElement(this.currencyListSelector(currencyTicker));
    await this.verifyElementText(this.fiatDrawer, currencyTicker);
  }

  @step("Expect asset selected to be displayed")
  async verifySelectedAssetIsDisplayed(account: AccountType) {
    await this.verifyElementText(this.cryptoCurrencySelector, account.currency.ticker);
    await this.verifyElementText(this.cryptoCurrencySelectorLabel, getParentAccountName(account));
  }

  @step("Verify buy sell screen is visible with $1 selected and the crypto asset selected")
  async verifyBuySellLandingAndCryptoAssetSelector(account: AccountType, operation: string) {
    await this.verifyBuySellScreenIsVisible();
    await this.verifySelectedTab(operation);
    await this.verifySelectedAssetIsDisplayed(account);
  }

  @step("Verify fiat asset selected as $0")
  async verifyFiatAssetSelector(fiatCurrencyTicker: string) {
    await this.verifyElementText(this.fiatOptionSelector, fiatCurrencyTicker);
  }

  @step("Verify provider info is not visible")
  async verifyProviderInfoIsNotVisible() {
    await this.verifyElementIsNotVisible(this.paymentSelector);
    await this.verifyElementIsNotVisible(this.providersList);
  }

  @step("Verify info box")
  async verifyInfoBox() {
    await this.verifyElementIsVisible(this.infoBox);
    await this.verifyElementText(this.infoBox, "Buy securely with Ledger");
  }

  @step("Enter amount to pay $0")
  async setAmountToPay(amount: string, operation: string) {
    await this.setValue(this.amountInputSection, amount);

    await this.verifyElementText(
      this.formCta,
      operation == OperationType.Buy ? "Select quote to continue" : "Set an amount to get quotes",
    );
    await this.verifyElementIsNotEnabled(this.formCta);
    await this.verifyElementIsVisible(this.paymentSelector);
    await this.verifyElementIsVisible(this.providersList);
  }

  @step("Select provider quote for $1")
  async selectProviderQuote(operation: string, providerName: string) {
    if (await this.isTextVisible(this.showMoreQuotes)) {
      await this.clickElementByText(this.showMoreQuotes);
    }
    await this.scrollToElement(this.provider(providerName));
    await this.clickElement(this.provider(providerName));
    await this.verifyElementText(this.formCta, `${operation} with ${providerName}`);
  }

  @step("Select quote")
  async selectQuote() {
    await this.verifyElementIsEnabled(this.formCta);
    await this.clickElement(this.formCta);
  }

  @step("Verify provider URL for $0")
  async verifyProviderUrl(providerName: string, buySell: BuySell, userdataDestinationPath: string) {
    await waitFor(
      async () => this.webviewUrlHistory.some(url => url.toLowerCase().includes("gotourl")),
      2_00,
      10_000,
    );
    const rawUrl = this.webviewUrlHistory.find(url => url.toLowerCase().includes("gotourl"));
    if (!rawUrl) {
      throw new Error("No URL with 'gotourl' found in webviewUrlHistory after waiting.");
    }
    const normalizedUrl = rawUrl.toLowerCase();

    this.verifyBasicUrlIncludes(normalizedUrl, providerName, buySell.operation);

    const decodedUrl = this.getDecodedGoToURL(normalizedUrl, rawUrl);
    this.verifyExpectedQueryParams(decodedUrl, providerName, buySell);
    await this.verifyDestinationAddress(providerName, buySell, decodedUrl, userdataDestinationPath);
  }

  private getDecodedGoToURL(rawLower: string, rawFull: string): string {
    const extractedGotoUrl = rawLower.match(/gotourl=([^&]*)/)?.[1];
    if (!extractedGotoUrl) {
      throw new Error(`No goToURL found in URL:\n ${rawFull}`);
    }
    return doubleDecodeGoToURL(extractedGotoUrl);
  }

  private verifyBasicUrlIncludes(
    normalizedUrl: string,
    providerName: string,
    operation: OperationType,
  ) {
    [
      [operation.toLowerCase(), `Tab "${operation}" missing`],
      [providerName.toLowerCase(), `Provider "${providerName}" missing`],
    ].forEach(([text, err]) => {
      this.assertIncludes(normalizedUrl, text, err);
    });
  }

  private getExpectations(providerName: string, buySell: BuySell): Record<string, string> {
    const config = this.providerConfigs[providerName];
    if (!config) throw new Error(`Unsupported provider: ${providerName}`);

    const rawMap = buySell.operation === OperationType.Buy ? config.buyParams : config.sellParams;

    const ret: Record<string, string> = {};
    for (const [key, fn] of Object.entries(rawMap)) {
      ret[key.toLowerCase()] = String(fn(buySell)).toLowerCase();
    }
    return ret;
  }

  private verifyExpectedQueryParams(decodedUrl: string, providerName: string, buySell: BuySell) {
    const expectations = this.getExpectations(providerName, buySell);
    for (const [param, val] of Object.entries(expectations)) {
      this.assertIncludes(decodedUrl, `${param}=${val}`, `query param`);
    }
  }

  private assertIncludes(haystack: string, substring: string, contextLabel: string) {
    expect(
      haystack,
      `Expected ${contextLabel} to include "${substring}", but got:\n  ${haystack}`,
    ).toContain(substring);
  }

  private async verifyDestinationAddress(
    providerName: string,
    buySell: BuySell,
    decodedUrl: string,
    userdataDestinationPath: string,
    config: ProviderConfig = this.providerConfigs[providerName],
  ) {
    const addresses = await getAccountAddressesFromAppJson(userdataDestinationPath);
    const normalizedDataAddresses = addresses.map(a => a.toLowerCase());

    const urlParams = new URLSearchParams(decodedUrl.split("?")[1] || "");
    const addressValue = urlParams.get(
      buySell.operation === OperationType.Buy ? config.addressParam : "address",
    );
    if (!addressValue) {
      throw new Error(`${config.addressParam} parameter missing in URL: ${decodedUrl}`);
    }

    const actualAddress = config.parseAddress
      ? config.parseAddress(addressValue)
      : addressValue.toLowerCase();

    expect(
      normalizedDataAddresses,
      `Expected one of ${JSON.stringify(normalizedDataAddresses)} to contain "${actualAddress}", but it did not.`,
    ).toContain(actualAddress);
  }
}
