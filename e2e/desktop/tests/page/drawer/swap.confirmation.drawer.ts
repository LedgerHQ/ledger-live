import { expect } from "@playwright/test";
import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";

export class SwapConfirmationDrawer extends Drawer {
  private fees = this.page.getByTestId("fees");
  private exchangeError = this.page.locator("#error-CompleteExchangeError span").first();
  private swapCompletedMessage = this.page.getByTestId("swap-completed-message");
  private swapCompletedDescription = this.page.getByTestId("swap-completed-description");
  private deviceActionError = this.page.getByTestId("error-description-deviceAction");

  @step("Get fees")
  async getFees() {
    return (await this.fees.textContent()) ?? "";
  }

  @step("Verify exchange error text content: $0")
  async verifyExchangeErrorTextContent(text: string) {
    await expect(this.exchangeError).toHaveText(text);
  }

  @step("Verify swap completion: $0")
  async verifyExchangeCompletedTextContent(currencyToReceive: string) {
    await expect(this.swapCompletedMessage).toHaveText("Transaction broadcast successfully", {
      timeout: 120000,
    });
    await expect(this.swapCompletedDescription).toHaveText(
      `Your Swap operation has been sent to the network for confirmation. Please wait for your transaction to be confirmed and for the provider to process and send your ${currencyToReceive}.`,
      { timeout: 60000 },
    );
  }

  @step("Check error message: $0")
  async checkErrorMessage(errorMessage: string) {
    const error = await this.deviceActionError.textContent();
    expect(error).toContain(errorMessage);
  }
}
