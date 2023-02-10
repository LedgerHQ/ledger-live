import { Page, Locator } from "@playwright/test";
import { waitFor } from "tests/utils/waitFor";

export class SwapPage {
  readonly page: Page;
  readonly swapMenuButton: Locator;
  readonly maxSpendableToggle: Locator;
  readonly accountByName: Function;
  readonly accountDropdownAddAccountButton: Locator;
  readonly reverseSwapPairButton: Locator;
  readonly addToAccountButton: Locator;
  readonly exchangeButton: Locator;
  readonly swapId: Locator;
  readonly seeDetailsButton: Locator;
  readonly detailsSwapId: Locator;
  readonly historyRow: Locator;
  readonly quoteContainer: Function;
  readonly changeTargetAccountButton: Locator;
  readonly changeNetworkFeesButton: Locator;
  readonly standardFeesSelector: Locator;
  readonly advancedFeesSelector: Locator;
  readonly customFeeTextbox: Locator;
  readonly targetAccountContainer: Function;

  constructor(page: Page) {
    this.page = page;
    this.swapMenuButton = page.locator("data-test-id=drawer-swap-button");
    this.maxSpendableToggle = page.locator("data-test-id=swap-max-spendable-toggle");
    this.accountByName = (accountName: string) => page.getByText(accountName);
    this.accountDropdownAddAccountButton = page.getByText("Add account");
    this.reverseSwapPairButton = page.locator("data-test-id=swap-reverse-pair-button");
    this.addToAccountButton = page.locator("data-test-id=add-destination-account-button");
    this.exchangeButton = page.locator("data-test-id=exchange-button");
    this.swapId = page.locator("data-test-id=swap-id");
    this.seeDetailsButton = page.locator('button:has-text("See details")');
    this.detailsSwapId = page.locator("data-test-id=details-swap-id").first();
    this.historyRow = page.locator(".swap-history-row").first();
    this.quoteContainer = (providerName: string, exchangeType: string) =>
      page.locator(`data-test-id=quote-container-${providerName}-${exchangeType}`);
    this.changeTargetAccountButton = page
      .locator("data-test-id=change-exchange-details-button")
      .first();
    this.changeNetworkFeesButton = page
      .locator("data-test-id=change-exchange-details-button")
      .last();
    this.standardFeesSelector = page.locator("data-test-id=standard-fee-mode-selector");
    this.advancedFeesSelector = page.locator("data-test-id=advanced-fee-mode-selector");
    this.customFeeTextbox = page.locator("data-test-id=currency-textbox");
    this.targetAccountContainer = (accountName: string): Locator =>
      page.locator(`data-test-id=target-account-container-${accountName}`).first();
  }

  async navigate() {
    await this.swapMenuButton.click();
    await this.maxSpendableToggle.waitFor({ state: "visible" });
  }

  async sendMax() {
    await this.maxSpendableToggle.click();
  }

  async openAccountDropdownByAccountName(accountName: string) {
    await this.accountByName(accountName).click();
  }

  async selectAccountByName(accountName: string) {
    await this.accountByName(accountName).click();
  }

  async addAccountFromAccountDropdown() {
    await this.accountDropdownAddAccountButton.click();
  }

  async reverseSwapPair() {
    await this.reverseSwapPairButton.click();
  }

  async addDestinationAccount() {
    await this.addToAccountButton.click();
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

  async verifySuccessfulExchange() {
    await this.swapId.waitFor({ state: "visible" });
    return this.swapId.innerText();
  }

  async navigateToExchangeDetails() {
    await this.seeDetailsButton.click();
    await this.swapId.waitFor({ state: "hidden" }); // for some reason the detailsSwapId visible check below is not sufficient and we need to check that this element is gone before checking the new page is available.
  }

  async verifyExchangeDetails() {
    await this.detailsSwapId.waitFor({ state: "visible" });
    return this.detailsSwapId.innerText();
  }

  // TODO: pull this function out into a utility function so we can use it elsewhere
  async verifyHistoricalSwapsHaveLoadedFully() {
    await this.page.waitForFunction(() => {
      const swapHistoryRow = document.querySelector(".swap-history-row");

      let swapHistoryStyles;
      if (swapHistoryRow) {
        swapHistoryStyles = window.getComputedStyle(swapHistoryRow);
        return swapHistoryStyles.getPropertyValue("opacity") === "1";
      }
    });
  }
}
