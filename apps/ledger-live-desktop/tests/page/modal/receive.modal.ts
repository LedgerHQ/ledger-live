import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export class ReceiveModal extends Modal {
  private skipDeviceButton = this.page.getByTestId("receive-connect-device-skip-device-button");
  private verifyAddressOnDeviceLabel = this.page.locator(
    "text=Verify that the shared address exactly matches the one on your device",
  );
  private approveLabel = this.page.locator("text=Address shared securely");
  private receiveAddressValue = (address: string) => this.page.locator(`text=${address}`);
  private addressDisplayedValue = this.page.locator("#address-field");
  private selectAccount = this.page.getByText("Choose a crypto asset");
  private warningMessage = this.page.locator('div[type="warning"]');
  readonly selectAccountInput = this.page.locator('[placeholder="Search"]');

  private sendAssetWarningMessage = (
    account: Account,
    specificTokens: string,
  ) => `Please only send ${account.currency.ticker} or ${specificTokens} tokens to ${account.currency.name} accounts. 
          Sending other crypto assets may result in the permanent loss of funds.`;
  private sendTronAddressActivationWarningMessage =
    "You first need to send at least 0.1 TRX to this address to activate it. Learn more";

  @step("Select token")
  async selectToken(SubAccount: Account) {
    await this.selectAccount.click();
    await this.selectAccountInput.fill(SubAccount.currency.name);
    await this.selectAccountInput.press("Enter");
  }

  async skipDevice() {
    await this.skipDeviceButton.click();
  }

  @step("Retrieve address displayed")
  async getAddressDisplayed() {
    const text = await this.addressDisplayedValue.textContent();
    return text ? text?.split(" ")[0] : "";
  }

  @step("Verify receive address correctness $0")
  async expectValidReceiveAddress(address: string) {
    await expect(this.verifyAddressOnDeviceLabel).toBeVisible();
    await expect(this.receiveAddressValue(address)).toBeVisible();
    expect(await this.addressDisplayedValue.innerText()).toEqual(address);
  }

  @step("Verify approve label visibility")
  async expectApproveLabel() {
    await expect(this.approveLabel).toBeVisible();
  }

  @step("Verify send currency / tokens warning message $1")
  async verifySendCurrencyTokensWarningMessage(account: Account, specificTokens: string) {
    await expect(this.warningMessage).toBeVisible();
    await expect(this.warningMessage).toContainText(
      this.sendAssetWarningMessage(account, specificTokens),
    );
  }

  @step("Verify TRON address activation warning message")
  async verifyTronAddressActivationWarningMessage() {
    await expect(this.warningMessage).toBeVisible();
    await expect(this.warningMessage).toContainText(this.sendTronAddressActivationWarningMessage);
  }
}
