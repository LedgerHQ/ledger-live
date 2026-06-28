/**
 * Receive flow — new-account discovery, on-device address verification,
 * and the final verified-address screen.
 */
import { byId } from "../helpers/elements";
import { TIMEOUTS } from "../helpers/timeouts";
import { CommonPage } from "./common.page";

export class ReceivePage extends CommonPage {
  private readonly addNewAccountButton = byId("add-new-account-button");
  private readonly verifyMyAddressButton = byId("button-verify-my-address");
  private readonly verifyAddressValue = byId("receive-verifyAddress-freshAdress");
  private readonly freshAddress = byId("receive-fresh-address");

  /**
   * Start BIP44 discovery for the freshly picked asset. This streams
   * `get_address` APDUs to the device — disable Detox sync right after.
   */
  async addNewAccount(): Promise<void> {
    await this.addNewAccountButton.tap();
  }

  /** Confirm the newly discovered account (discovery can take minutes). */
  async confirmAccountAddition(timeout = TIMEOUTS.XS): Promise<void> {
    await this.tapConfirm({ timeout });
  }

  /** Tap "Verify my address" on the receive security modal. */
  async verifyMyAddress(): Promise<void> {
    await this.verifyMyAddressButton.tap();
  }

  /** Read the address the app is asking the device to verify. */
  async getAddressToVerify(): Promise<string> {
    await this.verifyAddressValue.waitVisible();
    const address = await this.verifyAddressValue.getText();
    if (!address) throw new Error("could not read receive-verifyAddress-freshAdress");
    return address;
  }

  /** Wait for the final verified receive screen (QR + address). */
  async expectAddressVerified(): Promise<void> {
    await this.freshAddress.waitVisible();
  }
}
