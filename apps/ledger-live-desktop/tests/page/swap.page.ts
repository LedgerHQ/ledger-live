import { AppPage } from "tests/page/abstractClasses";
import { waitFor } from "../utils/waitFor";
import { step } from "tests/misc/reporters/step";
import { ElectronApplication, expect } from "@playwright/test";
import { capitalizeFirstLetter } from "tests/utils/textParserUtils";

export class SwapPage extends AppPage {
  private currencyByName = (accountName: string) => this.page.getByText(accountName); // TODO: this is rubbish. Changed this

  // Swap Amount and Currency components
  private maxSpendableToggle = this.page.getByTestId("swap-max-spendable-toggle");
  private originCurrencyDropdown = this.page.getByTestId("origin-currency-dropdown");
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

  // Quote Filter Components
  private centralisedQuoteFilterButton = this.page.getByTestId("centralised-quote-filter-button");
  private decentralisedQuoteFilterButton = this.page.getByTestId(
    "decentralised-quote-filter-button",
  );
  private floatQuoteFilterButton = this.page.getByTestId("float-quote-filter-button");
  private fixedQuoteFilterButton = this.page.getByTestId("fixed-quote-filter-button");

  // Quote Components
  private quoteContainer = (providerName: string, exchangeType: string) =>
    this.page.getByTestId(`quote-container-${providerName}-${exchangeType}`);

  // Exchange Button Component
  private exchangeButton = this.page.getByTestId("exchange-button");

  // Exchange Drawer Components
  readonly swapId = this.page.getByTestId("swap-id");
  private seeDetailsButton = this.page.locator('button:has-text("See details")');
  readonly detailsSwapId = this.page.getByTestId("details-swap-id").first();

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

  @step("Select exchange quote $0 with rate $1")
  async selectExchangeQuote(
    providerName: "changelly" | "cic" | "oneinch" | "paraswap",
    exchangeType: "fixed" | "float",
  ) {
    await this.quoteContainer(providerName, exchangeType).click();
  }

  async waitForExchangeToBeAvailable() {
    return waitFor(() => this.exchangeButton.isEnabled(), 250, 10000);
  }

  @step("Click Exchange button")
  async clickExchangeButton(electronApp: ElectronApplication, provider: string) {
    const [, webview] = electronApp.windows();
    await webview.getByText(`Swap with ${capitalizeFirstLetter(provider)}`).click();
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

  @step("Select account to swap from: $0")
  async selectAccountToSwapFrom(accountToSwapFrom: string) {
    await this.originCurrencyDropdown.click();
    await this.dropdownOptions.locator(this.optionWithText(accountToSwapFrom)).click();
    const selectedAccountFrom = this.originCurrencyDropdown.locator(this.dropdownSelectedValue);
    await expect(selectedAccountFrom).toHaveText(accountToSwapFrom);
    await this.waitForPageLoadState();
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
}
