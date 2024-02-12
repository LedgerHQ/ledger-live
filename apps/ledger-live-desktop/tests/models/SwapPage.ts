import { Page, Locator } from "@playwright/test";
import { waitFor } from "../utils/waitFor";

export class SwapPage {
  readonly page: Page;
  readonly swapMenuButton: Locator;
  readonly maxSpendableToggle: Locator;
  readonly destinationCurrencyDropdown: Locator;
  readonly currencyByName: (accountName: string) => Locator;
  readonly fromCurrencyDropdownAddAccountButton: Locator;
  readonly reverseSwapPairButton: Locator;
  readonly addDestinationAccountButton: Locator;
  readonly exchangeButton: Locator;
  readonly swapId: Locator;
  readonly seeDetailsButton: Locator;
  readonly detailsSwapId: Locator;
  readonly historyRow: Locator;
  readonly quoteContainer: (providerName: string, exchangeType: string) => Locator;
  readonly changeTargetAccountButton: Locator;
  readonly changeNetworkFeesButton: Locator;
  readonly standardFeesSelector: Locator;
  readonly advancedFeesSelector: Locator;
  readonly customFeeTextbox: Locator;
  readonly targetAccountContainer: (accountName: string) => Locator;
  readonly centralisedQuoteFilterButton: Locator;
  readonly decentralisedQuoteFilterButton: Locator;
  readonly floatQuoteFilterButton: Locator;
  readonly fixedQuoteFilterButton: Locator;
  readonly swapProviderRates: Locator;

  constructor(page: Page) {
    // Misc Swap Components
    this.page = page;
    this.swapMenuButton = page.locator("data-test-id=drawer-swap-button"); // TODO: Should this be here?
    this.currencyByName = accountName => page.getByText(accountName); // TODO: this is rubbish. Changed this

    // Swap Amount and Currency components
    this.maxSpendableToggle = page.locator("data-test-id=swap-max-spendable-toggle");
    this.destinationCurrencyDropdown = page.locator("data-test-id=destination-currency-dropdown");
    this.fromCurrencyDropdownAddAccountButton = page.getByText("Add account");
    this.reverseSwapPairButton = page.locator("data-test-id=swap-reverse-pair-button");
    this.addDestinationAccountButton = page.locator("data-test-id=add-destination-account-button");
    this.changeTargetAccountButton = page
      .locator("data-test-id=change-exchange-details-button")
      .first();
    this.targetAccountContainer = accountName =>
      page.locator(`data-test-id=target-account-container-${accountName}`).first();

    // Network Fee Components
    this.changeNetworkFeesButton = page
      .locator("data-test-id=change-exchange-details-button")
      .last();
    this.standardFeesSelector = page.locator("data-test-id=standard-fee-mode-selector");
    this.advancedFeesSelector = page.locator("data-test-id=advanced-fee-mode-selector");
    this.customFeeTextbox = page.locator("data-test-id=currency-textbox");

    // Quote Filter Components
    this.centralisedQuoteFilterButton = page.locator(
      "data-test-id=centralised-quote-filter-button",
    );
    this.decentralisedQuoteFilterButton = page.locator(
      "data-test-id=decentralised-quote-filter-button",
    );
    this.floatQuoteFilterButton = page.locator("data-test-id=float-quote-filter-button");
    this.fixedQuoteFilterButton = page.locator("data-test-id=fixed-quote-filter-button");

    // Quote Components
    this.quoteContainer = (providerName, exchangeType) =>
      page.locator(`data-test-id=quote-container-${providerName}-${exchangeType}`);

    // Exchange Button Component
    this.exchangeButton = page.locator("data-test-id=exchange-button");

    // Exchange Drawer Components
    this.swapId = page.locator("data-test-id=swap-id");
    this.seeDetailsButton = page.locator('button:has-text("See details")');
    this.detailsSwapId = page.locator("data-test-id=details-swap-id").first();

    // Swap History Components
    this.historyRow = page.locator(".swap-history-row").first();

    // Swap Provider Rates
    this.swapProviderRates = page.locator("data-test-id='swap2.provider-rates'");
  }

  async navigate() {
    await this.swapMenuButton.click();
  }

  async waitForSwapFormToLoad() {
    await this.maxSpendableToggle.waitFor({ state: "visible" });
  }

  async sendMax() {
    await this.maxSpendableToggle.click();
  }

  async openDestinationCurrencyDropdown() {
    await this.destinationCurrencyDropdown.click();
  }

  async waitForCurrenciesToExist() {
    await this.page.getByRole("option");
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

  async filterByCentralisedQuotes() {
    await this.centralisedQuoteFilterButton.click();
  }

  async filterByDecentralisedQuotes() {
    await this.decentralisedQuoteFilterButton.click();
  }

  async filterByFloatingRateQuotes() {
    await this.floatQuoteFilterButton.click();
  }

  async filterByFixedRateQuotes() {
    await this.fixedQuoteFilterButton.click();
  }

  async selectExchangeQuote(
    providerName: "changelly" | "cic" | "oneinch" | "paraswap",
    exchangeType: "fixed" | "float",
  ) {
    await this.quoteContainer(providerName, exchangeType).click();
  }

  async waitForExchangeToBeAvailable() {
    return waitFor(() => this.exchangeButton.isEnabled(), 250, 10000);
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

  async waitForProviderRates() {
    await this.centralisedQuoteFilterButton.waitFor({ state: "visible" });
    await this.decentralisedQuoteFilterButton.waitFor({ state: "visible" });
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
}
