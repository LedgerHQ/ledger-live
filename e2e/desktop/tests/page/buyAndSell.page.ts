import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "tests/page/webViewApp.page";
import { AccountType, getParentAccountName } from "@ledgerhq/live-e2e-shared/enum/Account";
import { BuySell, Fiat } from "@ledgerhq/live-e2e-shared/models/BuySell";
import { expect } from "@playwright/test";
import { ChooseAssetDrawer } from "tests/page/drawer/choose.asset.drawer";
import { BuySellProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { pickRotatingProvider } from "@ledgerhq/live-e2e-shared/buySell";
import { OperationType } from "@ledgerhq/live-e2e-shared/enum/OperationType";
import { doubleDecodeGoToURL } from "tests/utils/urlUtils";
import { getAccountAddressesFromAppJson } from "tests/utils/getAccountAddressesUtils";
import { waitFor } from "tests/utils/waitFor";
import { ModularDialog } from "tests/page/dialog/modular.dialog";
import { getModularSelectorFromInstance } from "tests/utils/modularSelectorUtils";

interface ProviderConfig {
  buyParams: Record<string, (buySell: BuySell) => string | number>;
  sellParams: Record<string, (buySell: BuySell) => string | number>;
  addressParam: string;
  parseAddress?: (value: string) => string;
}

export class BuyAndSellPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "buy";

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
  private amountInputError = "amount-input-section-error";
  private maxAmountButton = "max";
  private providerTitleCssSelector =
    "[data-testid^='provider_title_'][data-testid$='_title_container']";

  private chooseAssetDrawer = new ChooseAssetDrawer(this.page);
  private modularDialog = new ModularDialog(this.page);

  private standardSellParams: Record<string, (buySell: BuySell) => string | number> = {
    cryptoAmount: buySell => buySell.amount,
    cryptoCurrency: buySell => buySell.crypto.currency.ticker,
    fiatCurrency: buySell => buySell.fiat.currencyTicker,
  };

  private providerConfigs: Record<string, ProviderConfig> = {
    [BuySellProvider.MOONPAY.uiName]: {
      buyParams: {
        baseCurrencyAmount: buySell => buySell.amount,
        currencyCode: buySell => buySell.crypto.currency.ticker,
        baseCurrencyCode: buySell => buySell.fiat.currencyTicker,
      },
      sellParams: this.standardSellParams,
      addressParam: "walletaddress",
    },
  };

  private providerUrlAliases: Record<string, string> = {
    [BuySellProvider.MERCURYO.uiName]: "mrcr",
  };

  @step("Expect Buy / Sell screen to be visible")
  async verifyBuySellScreenIsVisible() {
    await this.waitForWebviewReady(this.navigationTabs);
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

  @step("Select network/account in the modular drawer if it opens")
  async selectNetworkAndAccountIfShown(account: AccountType) {
    if (await this.modularDialog.waitForNetworkDialogVisible()) {
      await this.modularDialog.selectNetwork(account.currency);
      if (await this.modularDialog.waitForAccountSelectionVisible()) {
        await this.modularDialog.selectAccountByName(account);
      }
    }
  }

  @step("Choose crypto asset if not selected")
  async chooseAssetIfNotSelected(account: AccountType) {
    await this.waitForWebviewReady(this.cryptoCurrencySelector);
    if (await this.isCorrectAssetAlreadySelected(account)) return;
    await this.clickElement(this.cryptoCurrencySelector);
    await this.selectAssetInDrawer(account);
  }

  /**
   * Workaround: PTX Buy/Sell web app can remain stuck loading; reload the webview and retry.
   * Mirrors the recovery used in borrow.page.ts. Used to guard every entry point that lands
   * on the Buy/Sell webview, not just the crypto selector step.
   */
  @step("Wait for the Buy/Sell web app to finish loading")
  private async waitForWebviewReady(testId: string) {
    const readyTimeout = 30_000;
    const maxReloads = 2;

    for (let attempt = 0; ; attempt++) {
      // Re-fetch the webview on every attempt: it can be torn down and recreated
      // while we wait, and reloading a stale handle throws
      // "Target page, context or browser has been closed".
      const webview = await this.getWebView();
      const selector = webview.getByTestId(testId);
      try {
        await expect(selector).toBeVisible({ timeout: readyTimeout });
        return;
      } catch (error) {
        if (attempt >= maxReloads) {
          throw new Error(
            `Buy/Sell web app did not render "${testId}" after ${maxReloads + 1} attempts — ` +
              `webview stuck loading.`,
            { cause: error },
          );
        }
        // The webview can also be torn down/recreated during the toBeVisible() wait above,
        // so re-fetch it again right before reloading, and tolerate a reload failure caused
        // by that same race — the next iteration re-fetches and re-checks instead of
        // aborting the whole retry loop.
        try {
          const freshWebview = await this.getWebView();
          await freshWebview.reload({ timeout: readyTimeout, waitUntil: "domcontentloaded" });
        } catch {
          // Ignore: target likely closed mid-wait; next attempt re-resolves the webview.
        }
      }
    }
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
    const selector = await getModularSelectorFromInstance(this.page, this.modularDialog);
    if (selector) {
      await this.selectAssetInModularSelector(account, selector);
    } else {
      await this.selectAssetInLegacyDrawer(account);
    }
  }

  private async selectAssetInModularSelector(account: AccountType, selector: ModularDialog) {
    await selector.validateItems();
    await selector.selectAsset(account.currency);
    await selector.selectNetwork(account.currency);
    await selector.selectAccountByName(account);
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

  @step("Verify buy info box")
  async verifyBuyInfoBox() {
    await this.verifyElementIsVisible(this.infoBox);
    await this.verifyElementText(this.infoBox, "Buy securely with Ledger");
  }

  @step("Verify sell info box")
  async verifySellInfoBox() {
    await this.verifyElementIsVisible(this.infoBox);
    await this.verifyElementText(this.infoBox, "Sell securely with Ledger");
  }

  // Falls back to the max sellable balance if the requested amount exceeds it.
  @step("Enter amount to pay $0")
  async setAmountToPay(amount: string, operation: string): Promise<string> {
    await this.setValue(this.amountInputSection, amount);

    await this.verifyElementText(
      this.formCta,
      operation === OperationType.Buy ? "Select quote to continue" : "Set an amount to get quotes",
    );
    await this.verifyElementIsNotEnabled(this.formCta);

    let balanceTooLow = false;
    if (operation === OperationType.Sell) {
      try {
        await this.verifyElementIsVisible(this.amountInputError, 2000);
        balanceTooLow = true;
      } catch {
        // No error shown — balance covers the requested amount.
      }
    }
    if (balanceTooLow) {
      await this.clickElement(this.maxAmountButton);
    }

    await this.verifyElementIsVisible(this.paymentSelector);
    const finalAmount = await (
      await this.getWebViewElementByTestId(this.amountInputSection)
    ).inputValue();
    // Max must have lowered the amount; guards against a click that silently did nothing.
    if (balanceTooLow) {
      expect(Number(finalAmount)).toBeLessThan(Number(amount));
    }
    await this.verifyElementIsVisible(this.providersList);
    return finalAmount;
  }

  @step("Select provider quote")
  async selectProviderQuote(operation: string, provider: BuySellProvider) {
    if (await this.isTextVisible(this.showMoreQuotes)) {
      await this.clickElementByText(this.showMoreQuotes);
    }
    await this.scrollToElement(this.provider(provider.name));
    await this.clickElement(this.provider(provider.name));
    await this.verifyElementText(this.formCta, `${operation} with ${provider.uiName}`);
  }

  @step("Get available providers")
  async getAvailableProviders(): Promise<string[]> {
    if (await this.isTextVisible(this.showMoreQuotes)) {
      await this.clickElementByText(this.showMoreQuotes);
    }
    const titles = await this.getTextsByCssSelector(this.providerTitleCssSelector);
    return titles.map(title => title.trim());
  }

  @step("Select rotating provider")
  async selectRotatingProvider(operation: string): Promise<BuySellProvider> {
    const availableProviders = await this.getAvailableProviders();
    const selected = pickRotatingProvider(availableProviders);
    await this.logSelectedProvider(selected.uiName);
    await this.selectProviderQuote(operation, selected);
    return selected;
  }

  @step("Selected provider: $0")
  async logSelectedProvider(providerName: string) {
    expect(providerName).toBeDefined();
  }

  @step("Select quote")
  async selectQuote() {
    await this.verifyElementIsEnabled(this.formCta);
    await this.clickElement(this.formCta);
  }

  @step("Verify provider URL")
  async verifyProviderUrl(
    provider: BuySellProvider,
    buySell: BuySell,
    userdataDestinationPath: string,
  ) {
    const rawUrl = await this.waitForGoToUrl();
    const url = new URL(decodeGoToUrl(rawUrl));

    this.verifyProviderInUrl(url, provider);

    const config = this.providerConfigs[provider.uiName];
    if (!config) return;

    const addresses = await getAccountAddressesFromAppJson(userdataDestinationPath);
    this.verifyQueryParams(url, config, buySell);
    await this.verifyDestinationAddress(url, config, buySell, addresses);
  }

  private verifyProviderInUrl(url: URL, provider: BuySellProvider) {
    const href = url.href.toLowerCase().replace(/[^a-z0-9]/g, "");
    const expected = (this.providerUrlAliases[provider.uiName] ?? provider.uiName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    expect(href.includes(expected), `Provider "${provider.uiName}" should appear in URL`).toBe(
      true,
    );
  }

  private async waitForGoToUrl(): Promise<string> {
    let stableUrl: string | undefined;

    await waitFor(
      async () => {
        const goToUrls = this.webviewUrlHistory.filter(url =>
          url.toLowerCase().includes("gotourl"),
        );
        const latest = goToUrls.at(-1);
        if (latest !== undefined && latest === stableUrl) {
          return true; // last gotourl unchanged since previous check → settled
        }
        stableUrl = latest;
        return false;
      },
      200,
      10_000,
    );

    if (!stableUrl) throw new Error("No GoTo URL found in webviewUrlHistory after waiting.");
    return stableUrl;
  }

  private verifyQueryParams(url: URL, config: ProviderConfig, buySell: BuySell) {
    const expectations = this.getExpectedQueryParams(config, buySell);
    const params = Object.fromEntries(
      Array.from(url.searchParams).map(([k, v]) => [k.toLowerCase(), v]),
    );

    for (const [expectedKey, expectedValue] of Object.entries(expectations)) {
      const actualValue = params[expectedKey];
      if (actualValue === undefined) {
        throw new Error(`Query param "${expectedKey}" not found in URL`);
      }
      expect(
        actualValue.toLowerCase(),
        `Query param "${expectedKey}" should include "${expectedValue}"`,
      ).toContain(expectedValue);
    }
  }

  private getExpectedQueryParams(config: ProviderConfig, buySell: BuySell): Record<string, string> {
    const paramMap = buySell.operation === OperationType.Buy ? config.buyParams : config.sellParams;

    return Object.fromEntries(
      Object.entries(paramMap).map(([key, fn]) => [
        key.toLowerCase(),
        String(fn(buySell)).toLowerCase(),
      ]),
    );
  }

  private async verifyDestinationAddress(
    url: URL,
    config: ProviderConfig,
    buySell: BuySell,
    addresses: string[],
  ) {
    const normalizedAddresses = addresses.map(a => a.toLowerCase());

    const expectedParam = buySell.operation === OperationType.Buy ? config.addressParam : "address";

    const actualParam = Array.from(url.searchParams.keys()).find(
      key => key.toLowerCase() === expectedParam.toLowerCase(),
    );

    if (!actualParam) throw new Error(`Missing address param "${expectedParam}" in URL`);

    const rawValue = url.searchParams.get(actualParam)!;
    const actualAddress = config.parseAddress
      ? config.parseAddress(rawValue)
      : rawValue.toLowerCase();

    expect(
      normalizedAddresses,
      `Destination address should match one of the app accounts`,
    ).toContain(actualAddress);
  }
}

function decodeGoToUrl(rawUrl: string): string {
  const match = rawUrl.match(/gotourl=([^&]+)/i);
  if (!match) throw new Error(`Missing 'goToURL' param in URL:\n${rawUrl}`);
  return doubleDecodeGoToURL(match[1]);
}
