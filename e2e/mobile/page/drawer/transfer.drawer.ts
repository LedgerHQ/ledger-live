import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";

/** The Transfer bottom sheet of the quick actions, opened from the portfolio and the account screens. */
export default class TransferDrawer {
  private readonly drawer = byId("transfer-drawer");
  private readonly receiveButton = byId("transfer-action-receive");
  private readonly sendButton = byId("transfer-action-send");
  private readonly bankTransferButton = byId("transfer-action-bank-transfer");
  private readonly assetPicker = byId("transfer-asset-picker-list");
  private readonly assetPickerRow = (currencyId: string) =>
    byId(`transfer-asset-picker-${currencyId}`);

  // Anchor on the container: the controls are matchable while the sheet still slides (QAA-1522).
  async waitSettled() {
    await this.drawer.waitFullyVisible();
  }

  @Step("Expect transfer drawer receive action")
  async expectReceiveVisible() {
    await this.receiveButton.expectVisible();
  }

  @Step("Expect transfer drawer send action")
  async expectSendVisible() {
    await this.sendButton.expectVisible();
  }

  @Step("Expect transfer drawer bank transfer action")
  async expectBankTransferVisible() {
    await this.bankTransferButton.expectVisible();
  }

  @Step("Tap on transfer drawer receive action")
  async tapReceive() {
    await this.waitSettled();
    await this.receiveButton.tap();
  }

  @Step("Tap on transfer drawer send action")
  async tapSend() {
    await this.waitSettled();
    await this.sendButton.tap();
  }

  @Step("Tap on transfer drawer bank transfer action")
  async tapBankTransfer() {
    await this.waitSettled();
    await this.bankTransferButton.tap();
  }

  @Step("Close transfer drawer")
  async close() {
    await this.drawer.swipe("down");
    await this.drawer.waitNotVisible();
  }

  async isAssetPickerVisible(timeout: number) {
    return await this.assetPicker.isVisible(timeout);
  }

  @Step("Pick asset {{{0}}} in the transfer drawer")
  async pickAsset(currencyId: string) {
    await this.assetPicker.waitFullyVisible();
    // The rows are sorted by value: the asset can sit below the visible ones.
    await this.assetPickerRow(currencyId).scrollTo(this.assetPicker);
    await this.assetPickerRow(currencyId).tap();
  }
}
