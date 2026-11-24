import { Step } from "jest-allure2-reporter/api";
import { byId, byIdWithDescendantText } from "@e2e/helpers/elements/native";

/** The row to pick by the id of its currency, or, when that id is not known, by the name of its token. */
export type AssetToPick = Readonly<{ currencyId: string } | { tokenName: string }>;

/** The Transfer bottom sheet of the quick actions, opened from the portfolio and the account screens. */
export default class TransferDrawer {
  private readonly drawer = byId("transfer-drawer");
  private readonly receiveButton = byId("transfer-action-receive");
  private readonly sendButton = byId("transfer-action-send");
  private readonly bankTransferButton = byId("transfer-action-bank-transfer");
  private readonly assetPicker = byId("transfer-asset-picker-list");
  private readonly assetPickerRow = (currencyId: string) =>
    byId(`transfer-asset-picker-${currencyId}`);
  // The id of a token row reads `<chain>/<standard>/<contract>`, unlike the list and the native rows.
  private readonly tokenRowNamed = (name: string) =>
    byIdWithDescendantText({ id: /^transfer-asset-picker-[^/]+\/.+/, text: name });

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

  @Step("Pick asset in the transfer drawer")
  async pickAsset(asset: AssetToPick) {
    const row =
      "currencyId" in asset
        ? this.assetPickerRow(asset.currencyId)
        : this.tokenRowNamed(asset.tokenName);
    await this.assetPicker.waitFullyVisible();
    // The rows are sorted by value: the asset can sit below the visible ones.
    await row.scrollTo(this.assetPicker);
    await row.tap();
  }
}
