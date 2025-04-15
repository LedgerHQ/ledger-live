import { AppPage } from "./abstractClasses";
import { waitFor } from "../utils/waitFor";
import { step } from "../misc/reporters/step";
import { ElectronApplication, expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { ChooseAssetDrawer } from "./drawer/choose.asset.drawer";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Swap";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import fs from "fs/promises";
import * as path from "path";
import { FileUtils } from "../utils/fileUtils";
import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";

export class SwapPage extends AppPage {
  // Swap Amount and Currency components
  private maxSpendableToggle = this.page.getByTestId("swap-max-spendable-toggle");
  private fromAccountCoinSelector = "from-account-coin-selector";
  private fromAccountAmoutInput = "from-account-amount-input";
  private toAccountCoinSelector = "to-account-coin-selector";
  private quoteCardProviderName = "quote-card-provider-name";
  private numberOfQuotes = "number-of-quotes";
  private destinationCurrencyDropdown = this.page.getByTestId("destination-currency-dropdown");
  private destinationCurrencyAmount = this.page.getByTestId("destination-currency-amount");
  private feesValue = this.page.getByTestId("fees-value");

  // Exchange Button Component
  private exchangeButton = this.page.getByTestId("exchange-button");

  // Exchange Drawer Components
  readonly swapId = this.page.getByTestId("swap-id");

  // History Components
  readonly historyButton = this.page.getByTestId("History-tab-button");
  private operationRows = this.page.locator("[data-testid^='operation-row-']");
  private exportOperationsButton = this.page.getByTestId("export-swap-operations-link");
  private selectSpecificOperation = (swapId: string) =>
    this.page.getByTestId(`operation-row-${swapId}`);
  private selectSpecificOperationProvider = (swapId: string) =>
    this.page.getByTestId(`swap-history-provider-${swapId}`);
  private selectSpecificOperationDate = (swapId: string) =>
    this.page.getByTestId(`swap-history-date-${swapId}`);
  private selectSpecificOperationAccountFrom = (swapId: string) =>
    this.page.getByTestId(`swap-history-from-account-${swapId}`);
  private selectSpecificOperationAccountTo = (swapId: string) =>
    this.page.getByTestId(`swap-history-to-account-${swapId}`);
  private selectSpecificOperationAmountFrom = (swapId: string) =>
    this.page.getByTestId(`swap-history-from-amount-${swapId}`);
  private selectSpecificOperationAmountTo = (swapId: string) =>
    this.page.getByTestId(`swap-history-to-amount-${swapId}`);

  private chooseAssetDrawer = new ChooseAssetDrawer(this.page);

  async sendMax() {
    await this.maxSpendableToggle.click();
  }

  @step("Get provider list")
  async getProviderList(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await expect(webview.getByTestId("number-of-quotes")).toBeVisible();
    await expect(webview.getByTestId("quotes-countdown")).toBeVisible();
    return await webview.getByTestId(this.quoteCardProviderName).allTextContents();
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
        .getByTestId(this.quoteCardProviderName)
        .getByText(provider)
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
          .getByTestId(this.quoteCardProviderName)
          .getByText(providerName)
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
      Provider.ONE_INCH.uiName,
      Provider.PARASWAP.uiName,
      Provider.MOONPAY.uiName,
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
    const swapButton = webview.getByRole("button", { name: `Swap with ${provider}` });
    await expect(swapButton).toBeVisible();
    await expect(swapButton).toBeEnabled();
    await swapButton.click();
  }

  @step("Go to provider live app")
  async goToProviderLiveApp(electronApp: ElectronApplication, provider: string) {
    const [, webview] = electronApp.windows();
    const continueButton = webview.getByRole("button", { name: `Continue with ${provider}` });
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
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

  @step("Verify swap amount error message match: $1")
  async verifySwapAmountErrorMessageIsCorrect(
    electronApp: ElectronApplication,
    message: string | RegExp,
  ) {
    const [, webview] = electronApp.windows();
    const errorSpan = await webview.getByTestId("from-account-error").textContent();
    expect(errorSpan).toMatch(message);
  }

  @step("Verify swap CTA banner displayed")
  async checkCtaBanner(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await expect(webview.getByTestId(`insufficient-funds-warning`)).toBeVisible();
  }

  @step("verify quotes are displayed")
  async checkQuotes(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await expect(webview.getByTestId(this.numberOfQuotes)).toBeVisible();
  }

  @step("Go and wait for Swap app to be ready")
  async goAndWaitForSwapToBeReady(swapFunction: () => Promise<void>, url?: string) {
    const successfulQuery = new Promise(resolve => {
      this.page.on("response", response => {
        if (
          response
            .url()
            .startsWith(url ?? "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees") &&
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

  @step("Go to swap history")
  async goToSwapHistory() {
    await this.historyButton.click();
  }

  @step("Check swap operation row details")
  async checkSwapOperation(swapId: string, provider: Provider, swap: Swap) {
    await expect(this.operationRows).toBeVisible();
    await expect(this.selectSpecificOperation(swapId)).toBeVisible();
    await expect(this.selectSpecificOperationProvider(swapId)).toContainText(provider.uiName);
    await expect(this.selectSpecificOperationDate(swapId)).toBeVisible();
    await expect(this.selectSpecificOperationAccountFrom(swapId)).toContainText(
      swap.accountToDebit.accountName,
    );
    await expect(this.selectSpecificOperationAccountTo(swapId)).toContainText(
      swap.accountToCredit.accountName,
    );
    await expect(this.selectSpecificOperationAmountFrom(swapId)).toContainText(swap.amount);
    await expect(this.selectSpecificOperationAmountTo(swapId)).toBeVisible();
  }

  @step("Open selected operation by swapId: $0")
  async openSelectedOperation(swapId: string) {
    await this.selectSpecificOperation(swapId).click();
  }

  @step("Click on export operations")
  async clickExportOperations() {
    await this.exportOperationsButton.click();

    const originalFilePath = path.resolve("./ledgerlive-swap-history.csv");
    const targetFilePath = path.resolve(__dirname, "../artifacts/ledgerlive-swap-history.csv");

    const fileExists = await FileUtils.waitForFileToExist(originalFilePath, 5000);
    expect(fileExists).toBeTruthy();
    const targetDir = path.dirname(targetFilePath);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.rename(originalFilePath, targetFilePath);
  }

  @step("Check contents of exported operations file")
  async checkExportedFileContents(swap: Swap, provider: Provider, id: string) {
    const targetFilePath = path.resolve(__dirname, "../artifacts/ledgerlive-swap-history.csv");
    const fileContents = await fs.readFile(targetFilePath, "utf-8");

    expect(fileContents).toContain(provider.name);
    expect(fileContents).toContain(id);
    expect(fileContents).toContain(swap.accountToDebit.currency.ticker);
    expect(fileContents).toContain(swap.accountToCredit.currency.ticker);
    expect(fileContents).toContain(swap.amount);
    expect(fileContents).toContain(swap.accountToDebit.accountName);
    expect(fileContents).toContain(swap.accountToDebit.address);
    expect(fileContents).toContain(swap.accountToCredit.accountName);
    expect(fileContents).toContain(swap.accountToCredit.address);
  }

  @step("Check minimum amount for swap")
  async getMinimumAmount(swap: Swap) {
    return getMinimumSwapAmount(swap).toString();
  }
}
