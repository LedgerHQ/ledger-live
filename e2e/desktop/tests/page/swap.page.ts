import { AppPage } from "./abstractClasses";
import { waitFor } from "../utils/waitFor";
import { step } from "../misc/reporters/step";
import { ElectronApplication, expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { ChooseAssetDrawer } from "./drawer/choose.asset.drawer";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { Device } from "@ledgerhq/live-common/e2e/enum/Device";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import fs from "fs/promises";
import * as path from "path";
import { FileUtils } from "../utils/fileUtils";
import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";

export class SwapPage extends AppPage {
  // Swap Amount and Currency components
  private maxSpendableToggle = this.page.getByTestId("swap-max-spendable-toggle");
  private fromAccountCoinSelector = "from-account-coin-selector";
  private fromAccountAmountInput = "from-account-amount-input";
  private toAccountCoinSelector = "to-account-coin-selector";
  private quoteCardProviderName = "quote-card-provider-name";
  private numberOfQuotes = "number-of-quotes";
  private destinationCurrencyDropdown = this.page.getByTestId("destination-currency-dropdown");
  private destinationCurrencyAmount = this.page.getByTestId("destination-currency-amount");
  private feesValue = this.page.getByTestId("fees-value");
  private switchButton = "to-account-switch-accounts";
  private swapMaxToggle = "from-account-max-toggle";
  private quoteInfosFeesSelector = "QuoteCard-info-fees-selector";

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
  private drawerContent = this.page.locator('[data-testid="drawer-content"]');
  private chooseAssetDrawer = new ChooseAssetDrawer(this.page);
  private insufficientFundsWarningElem = this.drawerContent.getByTestId(
    "insufficient-funds-warning",
  );
  private continueButton = this.drawerContent.getByRole("button", { name: "Continue" });
  private drawerCloseButton = this.drawerContent.getByTestId("drawer-close-button");

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
    await expect(webview.getByTestId(baseProviderLocator + "rate-infoIcon")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "rate-heading")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "rate-value")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "rate-fiat-value")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "slippage-heading")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "slippage-infoIcon")).toBeVisible();
    await expect(webview.getByTestId(baseProviderLocator + "slippage-value")).toBeVisible();
    if (
      provider === Provider.ONE_INCH.name ||
      provider === Provider.VELORA.name ||
      provider === Provider.UNISWAP.name ||
      provider === Provider.LIFI.name
    ) {
      await expect(webview.getByTestId(baseProviderLocator + "slippage-heading")).toBeVisible();
      await expect(webview.getByTestId(baseProviderLocator + "slippage-value")).toBeVisible();
    }
    await this.checkExchangeButton(electronApp, providerList[0]);
  }

  @step("Select specific provider $0")
  async selectSpecificProvider(provider: string, electronApp: ElectronApplication) {
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

  @step("Select available provider without KYC")
  async selectExchangeWithoutKyc(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();

    const providersList = await this.getProviderList(electronApp);

    const providersWithoutKYC = providersList.filter(providerName => {
      const provider = Object.values(Provider).find(p => p.uiName === providerName);
      if (process.env.SPECULOS_DEVICE === Device.LNS) {
        return provider && !provider.kyc && provider.availableOnLns;
      }
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

    throw new Error("No providers without KYC found");
  }

  @step("Select available provider")
  async selectExchange(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();

    const providersList = await this.getProviderList(electronApp);

    const providers = providersList.filter(providerName => {
      return Object.values(Provider).find(p => p.uiName === providerName);
    });

    for (const providerName of providers) {
      const providerLocator = webview
        .getByTestId(this.quoteCardProviderName)
        .getByText(providerName)
        .first();

      if (await providerLocator.isVisible()) {
        await providerLocator.click();
        return providerName;
      }
    }
    throw new Error("No valid providers found");
  }

  @step("Tap quote infos fees selector")
  async tapQuoteInfosFeesSelector(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await webview.getByTestId(this.quoteInfosFeesSelector).first().click();
  }

  @step("Check drawer error message ($0)")
  async checkFeeDrawerErrorMessage(errorMessage: string | RegExp) {
    await expect(this.insufficientFundsWarningElem).toHaveText(errorMessage);
    await expect(this.continueButton).toBeDisabled();
    await this.drawerCloseButton.click();
  }

  @step('Check "Best Offer" corresponds to the best quote')
  async checkBestOffer(electronApp: ElectronApplication) {
    const allQuoteTexts = await this.getAllSwapProviderTexts(electronApp);
    const parsedQuotes = this.parseQuotes(allQuoteTexts);

    const bestQuote = this.getBestQuote(parsedQuotes);
    const bestOfferText = await this.getBestOfferQuoteText(electronApp);

    expect(this.normalizeText(bestOfferText)).toContain(this.normalizeText(bestQuote.quote));
  }

  @step("Get all swap provider texts")
  private async getAllSwapProviderTexts(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    return webview
      .locator(
        '[data-testid^="quote-container-"][data-testid$="-fixed"], [data-testid^="quote-container-"][data-testid$="-float"]',
      )
      .allTextContents();
  }

  private parseQuotes(quotes: string[]) {
    const parsed = quotes
      .map(quote => {
        const match = quote.match(/Network Fees\s*\$([\d.]+).*?\$(\d+\.\d+)/);
        if (!match) return undefined;
        const [, fees, rate] = match.map(Number);
        return { rate, fees, quote };
      })
      .filter((q): q is { rate: number; fees: number; quote: string } => q !== undefined);

    if (parsed.length === 0) {
      throw new Error("No quotes found");
    }

    return parsed;
  }

  private getBestQuote(quotes: { rate: number; fees: number; quote: string }[]) {
    return quotes.reduce((best, current) =>
      !best || current.rate - current.fees > best.rate - best.fees ? current : best,
    );
  }

  private async getBestOfferQuoteText(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    return webview
      .locator(
        'section:has-text("Best offer") [data-testid^="quote-container-"][data-testid$="-fixed"], section:has-text("Best offer") [data-testid^="quote-container-"][data-testid$="-float"]',
      )
      .first()
      .innerText();
  }

  private normalizeText(text: string) {
    return text.replace(/\s+/g, "").trim();
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
      Provider.VELORA.uiName,
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

  @step("Retrieve send currency amount value")
  async getAmountToSend(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    return await webview.getByTestId(this.fromAccountAmountInput).inputValue();
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

  @step("Check currency to swap from is $0")
  async switchYouSendAndYouReceive(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await webview.getByTestId(this.switchButton).click();
  }

  @step("Check currency to swap from is $1")
  async checkAssetFrom(electronApp: ElectronApplication, currency: string) {
    const [, webview] = electronApp.windows();
    const fromAccount = webview.getByTestId(this.fromAccountCoinSelector);
    await expect(fromAccount).toContainText(currency);
  }

  @step("Expect asset or account selected $0 to be displayed")
  async expectSelectedAssetDisplayed(asset: string, electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await expect(webview.getByTestId(this.fromAccountCoinSelector)).toContainText(asset);
  }

  @step("Fill in amount: $1")
  async fillInOriginCurrencyAmount(electronApp: ElectronApplication, amount: string) {
    const [, webview] = electronApp.windows();
    await webview.getByTestId(this.fromAccountAmountInput).fill(amount);
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
    const assetTo = webview.getByTestId(this.toAccountCoinSelector);
    if (currency === "") {
      await expect(assetTo).toContainText("Choose asset");
    } else {
      await expect(assetTo).toContainText(currency);
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
  async goAndWaitForSwapToBeReady(swapFunction: () => Promise<void>) {
    const appReadyPromise = new Promise<void>(resolve => {
      this.page.on("console", msg => {
        if (msg.type() === "info" && msg.text().includes("Swap Live App Loaded")) {
          resolve();
        }
      });
    });

    await swapFunction();
    await appReadyPromise;
  }

  @step("Verify provider URL")
  async verifyProviderURL(electronApp: ElectronApplication, selectedProvider: string, swap: Swap) {
    const newWindow = await electronApp.waitForEvent("window");

    await newWindow.waitForLoadState();

    const url = newWindow.url();

    switch (selectedProvider) {
      case Provider.ONE_INCH.uiName: {
        const debitTicker = swap.accountToDebit.currency.ticker;
        const creditTicker = swap.accountToCredit.currency.ticker;

        if (!debitTicker || !creditTicker) {
          throw new Error("Missing ticker for one of the currencies");
        }

        await this.expectUrlToContainAll(url, [
          swap.amount,
          debitTicker,
          creditTicker,
          `swap%3Fledgerlive%3dtrue`,
          `src%3d${debitTicker}`,
          `dst%3d${creditTicker}`,
        ]);
        break;
      }
      case Provider.VELORA.uiName: {
        const debitContractAddress = swap.accountToDebit.currency.contractAddress;
        const creditContractAddress = swap.accountToCredit.currency.contractAddress;

        if (!debitContractAddress || !creditContractAddress) {
          throw new Error("Missing contract address on one of the currencies");
        }

        await this.expectUrlToContainAll(url, [
          swap.amount,
          debitContractAddress,
          creditContractAddress,
          `${debitContractAddress}-${creditContractAddress}`,
        ]);
        break;
      }
      default:
        throw new Error(
          `Unknown provider: ${selectedProvider}. Supported providers: ${Object.values(Provider)
            .map(p => p.uiName)
            .join(", ")}`,
        );
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
  async getMinimumAmount(accountFrom: Account, accountTo: Account) {
    return (await getMinimumSwapAmount(accountFrom, accountTo))?.toFixed(6) ?? "";
  }

  @step("Click on swap max")
  async clickSwapMax(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await webview.getByTestId(this.swapMaxToggle).click();
  }
}
