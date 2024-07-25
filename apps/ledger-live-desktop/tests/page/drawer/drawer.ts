import { Component } from "tests/page/abstractClasses";
import { expect } from "@playwright/test";
import { BasicTransaction } from "tests/models/Transaction";

export class Drawer extends Component {
  readonly content = this.page.getByTestId("drawer-content");
  private drawerOverlay = this.page.locator("[data-testid='drawer-overlay'][style='opacity: 1;']");
  private continueButton = this.page.getByTestId("drawer-continue-button");
  private closeButton = this.page.getByTestId("drawer-close-button");
  private currencyButton = (currency: string) =>
    this.page.getByTestId(`currency-row-${currency.toLowerCase()}`).first();
  private addressValue = (address: string) =>
    this.page.getByTestId("drawer-content").locator(`text=${address}`);
  private amountValue = (amount: string) =>
    this.page.getByTestId("drawer-content").locator(`text=${amount}`);
  readonly selectAssetTitle = this.page.getByTestId("select-asset-drawer-title").first();
  readonly selectAccountTitle = this.page.getByTestId("select-account-drawer-title").first();
  readonly swapAmountFrom = this.page.getByTestId("swap-amount-from").first();
  readonly swapAmountTo = this.page.getByTestId("swap-amount-to").first();
  readonly swapAccountFrom = this.page.getByTestId("swap-account-from").first();
  readonly swapAccountTo = this.page.getByTestId("swap-account-to").first();
  readonly backButton = this.page.getByRole("button", { name: "Back" });

  async continue() {
    await this.continueButton.click();
  }

  async adressValueIsVisible(address: string) {
    await this.addressValue(address).waitFor({ state: "visible" });
  }

  async amoutValueIsVisible(amount: string) {
    await this.amountValue(amount).waitFor({ state: "visible" });
  }

  async expectReceiverInfos(tx: BasicTransaction) {
    await expect(this.addressValue(tx.accountToDebit.address)).toBeVisible();
    await expect(this.addressValue(tx.accountToCredit.address)).toBeVisible();
    await expect(this.amountValue(tx.amount)).toBeVisible();
  }

  async waitForDrawerToBeVisible() {
    await this.content.waitFor({ state: "visible" });
    await this.closeButton.waitFor({ state: "visible" });
    await this.drawerOverlay.waitFor({ state: "attached" });
  }

  async waitForDrawerToDisappear() {
    await this.continueButton.waitFor({ state: "detached" });
    await this.closeButton.waitFor({ state: "detached" });
    await this.drawerOverlay.waitFor({ state: "detached" });
  }

  async close() {
    await this.closeButton.click();
  }

  // CURRENCY/ASSET ACTIONS
  async selectCurrency(currency: string) {
    await this.currencyButton(currency).click();
  }

  getAccountButton = (accountName: string, index: number) =>
    this.page.getByTestId(`account-row-${accountName.toLowerCase()}-${index}`).first();

  async selectAccount(accountName: string, index = 0) {
    await this.getAccountButton(accountName, index).click();
  }

  back() {
    return this.backButton.click();
  }
}
