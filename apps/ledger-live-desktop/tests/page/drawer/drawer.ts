import { Component } from "tests/page/abstractClasses";
import { expect } from "@playwright/test";
import { Transaction } from "tests/models/Transaction";
import { Delegate } from "tests/models/Delegate";
import { Account } from "tests/enum/Account";
import { step } from "tests/misc/reporters/step";

export class Drawer extends Component {
  readonly content = this.page.getByTestId("drawer-content");
  private drawerOverlay = this.page.locator("[data-testid='drawer-overlay'][style='opacity: 1;']");
  private continueButton = this.page.getByTestId("drawer-continue-button");
  private closeButton = this.page.getByTestId("drawer-close-button");
  private currencyButton = (currency: string) =>
    this.page.getByTestId(`currency-row-${currency.toLowerCase()}`).first();
  private addressValue = (address: string) =>
    this.page.locator('[data-testid="drawer-content"]').locator(`text=${address}`);
  private amountValue = this.page.getByTestId("amountReceived-drawer");
  readonly selectAssetTitle = this.page.getByTestId("select-asset-drawer-title").first();
  readonly selectAccountTitle = this.page.getByTestId("select-account-drawer-title").first();
  readonly swapAmountFrom = this.page.getByTestId("swap-amount-from").first();
  readonly swapAmountTo = this.page.getByTestId("swap-amount-to").first();
  readonly swapAccountFrom = this.page.getByTestId("swap-account-from").first();
  readonly swapAccountTo = this.page.getByTestId("swap-account-to").first();
  readonly backButton = this.page.getByRole("button", { name: "Back" });
  private provider = (provider: string) =>
    this.page.locator('[data-testid="drawer-content"]').locator(`text=${provider}`);
  private transactionType = this.page.getByTestId("transaction-type");

  async continue() {
    await this.continueButton.click();
  }

  @step("Verify address is visible")
  async addressValueIsVisible(address: string) {
    await this.addressValue(address).waitFor({ state: "visible" });
  }

  @step("Verify provider is visible")
  async providerIsVisible(account: Delegate) {
    if (account.account === Account.NEAR_1 || account.account === Account.ATOM_1) {
      await this.provider(account.provider).waitFor({ state: "visible" });
    }
  }

  @step("Verify amount is visible")
  async amountValueIsVisible() {
    await this.amountValue.waitFor({ state: "visible" });
  }

  @step("Verify transaction type is correct")
  async transactionTypeIsVisible() {
    await this.transactionType.waitFor({ state: "visible" });
  }

  @step("Verify that the information of the delegation is visible")
  async expectDelegationInfos(delegationInfo: Delegate) {
    await this.providerIsVisible(delegationInfo);
    await this.amountValueIsVisible();
    await this.transactionTypeIsVisible();
  }

  @step("Verify that the information of the transaction is visible")
  async expectReceiverInfos(tx: Transaction) {
    await expect(this.addressValue(tx.accountToCredit.address)).toBeVisible();
    await expect(this.amountValue).toBeVisible();
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

  @step("Close drawer")
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
