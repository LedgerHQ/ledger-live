import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { capitalizeFirstLetter } from "tests/utils/textParserUtils";

export class SwapConfirmationDrawer extends Drawer {
  private amountSent = this.page.getByTestId("amountSent");
  private amountReceived = this.page.getByTestId("amountReceived");
  private swapProvider = this.page.getByTestId("provider");
  private fees = this.page.getByTestId("fees");
  private sourceAccount = this.page.getByTestId("sourceAccount");
  private targetAccount = this.page.getByTestId("targetAccount");
  private exchangeError = this.page.locator("#error-CompleteExchangeError span").first();
  private swapCompletedMessage = this.page.getByTestId("swap-completed-message");
  private swapCompletedDescription = this.page.getByTestId("swap-completed-description");

  @step("Verify amount to send: $0")
  async verifyAmountSent(amount: string, currency: string) {
    await expect(this.amountSent).toHaveText(`${amount} ${currency}`);
  }

  @step("Verify amount to receive: $0")
  async verifyAmountToReceive(amount: string) {
    await expect(this.amountReceived).toHaveText(amount);
  }

  @step("Verify provider: $0")
  async verifyProvider(provider: string) {
    await expect(this.swapProvider).toHaveText(capitalizeFirstLetter(provider));
  }

  @step("Verify source currency: $0")
  async verifySourceAccount(sourceCurrency: string) {
    await expect(this.sourceAccount).toHaveText(sourceCurrency);
  }

  @step("Verify target currency: $0")
  async verifyTargetCurrency(targetCurrency: string) {
    await expect(this.targetAccount).toHaveText(targetCurrency);
  }

  @step("Get fees")
  async getFees() {
    return (await this.fees.textContent()) || "";
  }

  @step("Get amount to receive")
  async getAmountToReceive() {
    return (await this.amountReceived.textContent()) || "";
  }

  @step("Verify exchange error text content: $0")
  async verifyExchangeErrorTextContent(text: string) {
    await expect(this.exchangeError).toHaveText(text);
  }

  @step("Verify swap completion: $0")
  async verifyExchangeCompletedTextContent(currencyToReceive: string) {
    await expect(this.swapCompletedMessage).toHaveText("Transaction broadcast successfully");
    await expect(this.swapCompletedDescription).toHaveText(
      `Your Swap operation has been sent to the network for confirmation. Please wait for your transaction to be confirmed and for the provider to process and send your ${currencyToReceive}.`,
    );
  }
}
