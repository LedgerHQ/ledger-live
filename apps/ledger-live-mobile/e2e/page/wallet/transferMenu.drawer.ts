import { scrollToId, tapById } from "../../helpers";

export default class TransferMenuDrawer {
  transferScrollListId = "transfer-scroll-list";
  stakeMenuButtonId = "transfer-stake-button";
  transferButtonId = "transfer-button";
  swapTransferMenuButtonId = "swap-transfer-button";
  sendTransferMenuButtonId = "transfer-send-button";
  receiveTransfertMenuButtonId = "transfer-receive-button";

  async open() {
    await tapById(this.transferButtonId);
  }

  async navigateToSwap() {
    await scrollToId(this.swapTransferMenuButtonId);
    await tapById(this.swapTransferMenuButtonId);
  }

  async navigateToSend() {
    await scrollToId(this.sendTransferMenuButtonId);
    await tapById(this.sendTransferMenuButtonId);
  }

  async navigateToStake() {
    await scrollToId(this.stakeMenuButtonId);
    await tapById(this.stakeMenuButtonId);
  }

  async navigateToReceive() {
    await scrollToId(this.receiveTransfertMenuButtonId);
    await tapById(this.receiveTransfertMenuButtonId);
  }
}
