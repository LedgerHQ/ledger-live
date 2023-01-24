import { Page, Locator } from "@playwright/test";
import { waitFor } from "tests/utils/waitFor";

export class SwapPage {
  readonly page: Page;
  readonly swapMenuButton: Locator;
  readonly maxSpendableToggle: Locator;
  readonly exchangeButton: Locator;
  readonly swapId: Locator;
  readonly seeDetailsButton: Locator;
  readonly detailsSwapId: Locator;
  readonly historyRow: Locator;
  readonly quoteContainer: Function;
  readonly changeTargetAccountButton: Locator;
  readonly targetAccountContainer: Function;
  readonly changeNetworkFeesButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.swapMenuButton = page.locator("data-test-id=drawer-swap-button");
    this.maxSpendableToggle = page.locator("data-test-id=swap-max-spendable-toggle");
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
    this.targetAccountContainer = (accountName: string): Locator =>
      page.locator(`data-test-id=target-account-container-${accountName}`).first();
    this.changeNetworkFeesButton = page
      .locator("data-test-id=change-exchange-details-button")
      .last();
  }

  async navigate() {
    await this.swapMenuButton.click();
    await this.maxSpendableToggle.waitFor({ state: "visible" });
  }

  async sendMax() {
    await this.maxSpendableToggle.click();
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
