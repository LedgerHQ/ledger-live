import { AppPage } from "tests/page/abstractClasses";
import { waitFor } from "../utils/waitFor";
import { step } from "tests/misc/reporters/step";
import { ElectronApplication, expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { ChooseAssetDrawer } from "tests/page/drawer/choose.asset.drawer";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Swap";
import { Swap } from "@ledgerhq/live-common/lib-es/e2e/models/Swap";

export class SwapPage extends AppPage {
  private currencyByName = (accountName: string) => this.page.getByText(accountName); // TODO: this is rubbish. Changed this

  // Swap Amount and Currency components
  private maxSpendableToggle = this.page.getByTestId("swap-max-spendable-toggle");
  private fromAccountCoinSelector = "from-account-coin-selector";
  private fromAccountAmoutInput = "from-account-amount-input";
  private toAccountCoinSelector = "to-account-coin-selector";
  private errorSpan = (text: RegExp | string) => `span[color*="error"]:has-text("${text}")`;
  private numberOfQuotes = "number-of-quotes";
  private originCurrencyAmount = this.page.getByTestId("origin-currency-amount-value");
  private destinationCurrencyDropdown = this.page.getByTestId("destination-currency-dropdown");
  private destinationCurrencyAmount = this.page.getByTestId("destination-currency-amount");
  private feesValue = this.page.getByTestId("fees-value");
  private fromCurrencyDropdownAddAccountButton = this.page.getByText("Add account");
  private reverseSwapPairButton = this.page.getByTestId("swap-reverse-pair-button");
  private addDestinationAccountButton = this.page.getByTestId("add-destination-account-button");
  private changeTargetAccountButton = this.page
    .getByTestId("change-exchange-details-button")
    .first();
  private targetAccountContainer = (accountName: string) =>
    this.page.getByTestId(`target-account-container-${accountName}`).first();

  // Network Fee Components
  private changeNetworkFeesButton = this.page.getByTestId("change-exchange-details-button").last();
  private standardFeesSelector = this.page.getByTestId("standard-fee-mode-selector");
  private advancedFeesSelector = this.page.getByTestId("advanced-fee-mode-selector");
  private customFeeTextbox = this.page.getByTestId("currency-textbox");

  // Exchange Button Component
  private exchangeButton = this.page.getByTestId("exchange-button");

  // Exchange Drawer Components
  readonly swapId = this.page.getByTestId("swap-id");
  private seeDetailsButton = this.page.locator('button:has-text("See details")');
  readonly detailsSwapId = this.page.getByTestId("details-swap-id").first();

  private chooseAssetDrawer = new ChooseAssetDrawer(this.page);

  async waitForSwapFormToLoad() {
    await this.maxSpendableToggle.waitFor({ state: "visible" });
  }

  async sendMax() {
    await this.maxSpendableToggle.click();
  }

  async waitForCurrenciesToExist() {
    this.page.getByRole("option");
  }

  async filterDestinationCurrencyDropdown(filter: string) {
    await this.waitForCurrenciesToExist();
    await this.destinationCurrencyDropdown.click();
    await this.page.keyboard.type(filter);
  }

  async selectCurrencyFromCurrencyDropdown(textToSelect: string) {
    await this.waitForCurrenciesToExist();
    await this.page.getByRole("option").getByText(textToSelect).first().click();
  }

  async selectCurrencyByName(accountName: string) {
    await this.page.waitForTimeout(500); // TODO: Needs to be fixed once we have accessible element
    await this.currencyByName(accountName).click();
  }

  async addAccountFromAccountDropdown() {
    await this.fromCurrencyDropdownAddAccountButton.click();
  }

  async reverseSwapPair() {
    await this.reverseSwapPairButton.click();
    await this.page.waitForTimeout(500); // TODO: Needs to be fixed once we have accessible element
  }

  async addDestinationAccount() {
    await this.addDestinationAccountButton.click();
  }

  async openTargetAccountDrawer() {
    await this.changeTargetAccountButton.click();
  }

  async selectTargetAccount(accountName: string) {
    await this.targetAccountContainer(accountName).click();
  }

  async openNetworkFeesDrawer() {
    await this.changeNetworkFeesButton.click();
  }

  async selectStandardFees() {
    await this.standardFeesSelector.click();
  }

  async selectAdvancedFees() {
    await this.advancedFeesSelector.click();
  }

  async enterCustomFee(amount: string) {
    await this.customFeeTextbox.fill(amount);
  }

  async getProviderList(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await expect(webview.getByTestId("number-of-quotes")).toBeVisible();
    await expect(webview.getByTestId("quotes-countdown")).toBeVisible();
    const providersList = await webview
      .locator("//span[@data-testid='quote-card-provider-name']")
      .allTextContents();
    return providersList;
  }

  @step("Check quotes container infos")
  async checkQuotesContainerInfos(electronApp: ElectronApplication, providerList: string[]) {
    const [, webview] = electronApp.windows();

    const provider = Provider.getNameByUiName(providerList[0]);
    const baseProviderLocator = `quote-container-${provider}-`;

    await webview.getByTestId(baseProviderLocator + "amount-label").click();
    await expect(webview.getByTestId(baseProviderLocator + "amount-label")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "fiatAmount-label")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "networkFees-heading")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "networkFees-infoIcon")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "networkFees-value")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "networkFees-fiat-value")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "rate-heading")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "rate-value")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "rate-fiat-value")).toBeVisible();
    if (
      provider === Provider.ONE_INCH.name ||
      provider === Provider.PARASWAP.name ||
      provider === Provider.UNISWAP.name ||
      provider === Provider.LIFI.name
    ) {
      await expect(webview.getByTestId(baseProviderLocator + "slippage-heading")).toBeVisible();
      await expect(webview.getByTestId(baseProviderLocator + "slippage-value")).toBeVisible();
    }
    await this.checkExchangeButton(electronApp, providerList[0]);
  }

  @step("Select specific provider $0")
  async selectSpecificprovider(provider: string, electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();

    const providersList = await this.getProviderList(electronApp);

    if (providersList.includes(provider)) {
      const providerLocator = webview
        .locator(`//span[@data-testid='quote-card-provider-name' and text()='${provider}']`)
        .first();

      await providerLocator.isVisible();
      await providerLocator.click();
    } else {
      throw new Error("No valid providers found");
    }
  }

  @step("Select available provider")
  async selectExchange(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();

    const providersList = await this.getProviderList(electronApp);

    const providersWithoutKYC = providersList.filter(providerName => {
      const provider = Object.values(Provider).find(p => p.uiName === providerName);
      return provider && !provider.kyc;
    });

    for (const providerName of providersWithoutKYC) {
      const provider = Object.values(Provider).find(p => p.uiName === providerName);
      if (provider && provider.isNative) {
        const providerLocator = webview
          .locator(`//span[@data-testid='quote-card-provider-name' and text()='${providerName}']`)
          .first();

        await providerLocator.isVisible();
        await providerLocator.click();

        return providerName;
      }
    }

    throw new Error("No valid providers found");
  }

  @step("Get all swap providers available")
  async getAllSwapProviders(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    return await webview
      .locator(
        '[data-testid^="quote-container-"][data-testid$="-fixed"], [data-testid^="quote-container-"][data-testid$="-float"]',
      )
      .allTextContents();
  }

  @step("Extract quotes and fees")
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

  @step('Check "Best Offer" corresponds to the best quote')
  async checkBestOffer(electronApp: ElectronApplication) {
    const quoteContainers = await this.getAllSwapProviders(electronApp);
    try {
      const quotes = await this.extractQuotesAndFees(quoteContainers);
      const bestOffer = quotes.reduce<{ rate: number; fees: number; quote: string } | null>(
        (max, current) =>
          current && (!max || current.rate - current.fees > max.rate - max.fees) ? current : max,
        null,
      );
      expect(bestOffer?.quote).toContain("Best Offer");
    } catch (error) {
      console.error("Error checking Best offer:", error);
    }
  }

  @step("Wait for exchange to be available")
  async waitForExchangeToBeAvailable() {
    return waitFor(() => this.exchangeButton.isEnabled(), 250, 10000);
  }

  @step("Check exchange button is visible and enabled")
  async checkExchangeButton(electronApp: ElectronApplication, provider: string) {
    const [, webview] = electronApp.windows();

    const buttonText = [
      Provider.ONE_INCH.name,
      Provider.PARASWAP.name,
      Provider.MOONPAY.name,
      Provider.LIFI.name,
    ].includes(provider)
      ? `Continue with ${provider}`
      : `Swap with ${provider}`;

    const buttonLocator = webview.getByRole("button", { name: buttonText });
    await expect(buttonLocator).toBeVisible();
    await expect(buttonLocator).toBeEnabled();
  }

  @step("Click Exchange button")
  async clickExchangeButton(electronApp: ElectronApplication, provider: string) {
    const [, webview] = electronApp.windows();
    await expect(webview.getByRole("button", { name: `Swap with ${provider}` })).toBeEnabled();
    await webview.getByRole("button", { name: `Swap with ${provider}` }).click();
  }

  @step("Go to provider live app")
  async goToProviderLiveApp(electronApp: ElectronApplication, provider: string) {
    const [, webview] = electronApp.windows();
    const continueButton = webview.getByRole("button", { name: `Continue with ${provider}` });
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
  }

  async confirmExchange() {
    await this.exchangeButton.click();
  }

  async waitForSuccessfulExchange() {
    await this.swapId.waitFor({ state: "visible" });
  }

  async navigateToExchangeDetails() {
    await this.seeDetailsButton.click();
    await this.swapId.waitFor({ state: "hidden" }); // for some reason the detailsSwapId visible check below is not sufficient and we need to check that this element is gone before checking the new page is available.
  }

  async waitForExchangeDetails() {
    await this.detailsSwapId.waitFor({ state: "visible" });
    return this.detailsSwapId.innerText();
  }

  getAccountName(account: Account) {
    //erc20 accounts names are stored in account currency property
    return account.accountType ? account.currency.name : account.accountName;
  }

  @step("Fill in amount: $0")
  async fillInOriginAmount(originAmount: string) {
    await this.originCurrencyAmount.fill(originAmount);
  }

  @step("Select currency to swap to: $0")
  async selectCurrencyToSwapTo(currencyToSwapTo: string) {
    await this.waitForPageDomContentLoadedState();
    await expect(this.destinationCurrencyDropdown).toBeEnabled();
    await this.destinationCurrencyDropdown.click();
    await this.page.keyboard.type(currencyToSwapTo);
    await this.dropdownOptions.locator(this.optionWithText(currencyToSwapTo)).first().click();
    const selectedCurrencyTo = this.destinationCurrencyDropdown.locator(this.dropdownSelectedValue);
    await expect(selectedCurrencyTo).toHaveText(currencyToSwapTo);
  }

  @step("Retrieve destination currency amount value")
  async getDestinationCurrencyAmountValue() {
    return await this.destinationCurrencyAmount.inputValue();
  }

  @step("Retrieve fees amount value")
  async getFeesValue() {
    const text = await this.feesValue.textContent();
    return text ? text?.split(" ")[0] : "";
  }

  // TODO: pull this function out into a utility function so we can use it elsewhere
  async verifyHistoricalSwapsHaveLoadedFully() {
    await this.page.waitForFunction(async () => {
      const swapHistoryRow = document.querySelector(".swap-history-row");

      let swapHistoryStyles;
      if (swapHistoryRow) {
        swapHistoryStyles = window.getComputedStyle(swapHistoryRow);
        return swapHistoryStyles.getPropertyValue("opacity") === "1";
      }
    });
  }

  @step("Select currency to swap from")
  async selectAssetFrom(electronApp: ElectronApplication, accountToSwapFrom: Account) {
    const [, webview] = electronApp.windows();
    await webview.getByTestId(this.fromAccountCoinSelector).click();
    await this.chooseAssetDrawer.chooseFromAsset(accountToSwapFrom.currency.name);
  }

  @step("Check currency to swap from is $1")
  async checkAssetFrom(electronApp: ElectronApplication, currency: string) {
    const [, webview] = electronApp.windows();
    const fromAccount = await webview.getByTestId(this.fromAccountCoinSelector).innerText();
    expect(fromAccount).toContain(currency);
  }

  @step("Expect asset or account selected $0 to be displayed")
  async expectSelectedAssetDisplayed(asset: string, electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await expect(webview.getByTestId(this.fromAccountCoinSelector)).toContainText(asset);
  }

  @step("Fill in amount: $1")
  async fillInOriginCurrencyAmount(electronApp: ElectronApplication, amount: string) {
    const [, webview] = electronApp.windows();
    await webview.getByTestId(this.fromAccountAmoutInput).fill(amount);
    //wait for potential origin amount error to be loaded
    await this.page.waitForTimeout(500);
  }

  @step("Select currency to swap to: $1")
  async selectAssetTo(electronApp: ElectronApplication, currency: string) {
    const [, webview] = electronApp.windows();
    await webview.getByTestId(this.toAccountCoinSelector).click();
    await this.chooseAssetDrawer.chooseFromAsset(currency);
  }

  @step("Check currency to swap to is $1")
  async checkAssetTo(electronApp: ElectronApplication, currency: string) {
    const [, webview] = electronApp.windows();
    const assetTo = await webview.getByTestId(this.toAccountCoinSelector).innerText();
    if (currency === "") {
      expect(assetTo).toContain("Choose asset");
    } else {
      expect(assetTo).toContain(currency);
    }
  }

  @step("Verify swap amount error message is displayed: $2")
  async verifySwapAmountErrorMessageIsDisplayed(
    electronApp: ElectronApplication,
    accountToDebit: Account,
    message: string | RegExp,
  ) {
    const [, webview] = electronApp.windows();
    if (!accountToDebit.accountType) {
      //error message is flickering and changing, so we need to wait for it to be stable
      await this.page.waitForTimeout(1000);
      const errorSpan = await webview.getByTestId("from-account-error").textContent();
      expect(errorSpan).toMatch(message);
      //that specific amount error doesn't trigger quotes
      if (message instanceof RegExp) {
        await expect(webview.getByTestId(this.numberOfQuotes)).not.toBeVisible();
      }
    } else {
      await expect(webview.getByTestId(this.numberOfQuotes)).toBeVisible();
      await expect(webview.locator(this.errorSpan(message))).toBeVisible();
    }
    await expect(webview.getByTestId(`execute-button`)).not.toBeEnabled();
    await expect(webview.getByTestId(`insufficient-funds-warning`)).toBeVisible();
  }

  @step("Go and wait for Swap app to be ready")
  async goAndWaitForSwapToBeReady(swapFunction: () => Promise<void>, url?: string) {
    const successfulQuery = new Promise(resolve => {
      this.page.on("response", response => {
        if (
          response
            .url()
            .startsWith(url || "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees") &&
          response.status() === 200
        ) {
          resolve(response);
        }
      });
    });

    await swapFunction();
    expect(await successfulQuery).toBeDefined();
  }

  @step("Verify provider URL")
  async verifyProviderURL(electronApp: ElectronApplication, selectedProvider: string, swap: Swap) {
    const newWindow = await electronApp.waitForEvent("window");

    await newWindow.waitForLoadState();

    const url = newWindow.url();

    switch (selectedProvider) {
      case Provider.ONE_INCH.uiName: {
        expect(url).toContain(swap.accountToDebit.currency.ticker.toLowerCase());
        expect(url).toContain(swap.accountToCredit.currency.ticker.toLowerCase());
        expect(url).toContain(
          `swap%2F${swap.accountToDebit.currency.ticker.toLowerCase()}%2F${swap.accountToCredit.currency.ticker.toLowerCase()}`,
        );
        expect(url).toContain(swap.amount);
        break;
      }
      case Provider.PARASWAP.uiName: {
        expect(url).toContain(swap.amount);
        expect(url).toContain(swap.accountToDebit.currency.contractAddress);
        expect(url).toContain(swap.accountToCredit.currency.contractAddress);
        expect(url).toContain(
          `${swap.accountToDebit.currency.contractAddress}-${swap.accountToCredit.currency.contractAddress}`,
        );
        break;
      }
      default:
        throw new Error(`Unknown provider: ${selectedProvider}`);
    }
  }
}
