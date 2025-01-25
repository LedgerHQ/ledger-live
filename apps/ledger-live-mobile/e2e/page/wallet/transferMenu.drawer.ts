import { tapById } from "../../helpers";

export default class TransferMenuDrawer {
  stakeMenuButtonId = "transfer-stake-button";
  transferButtonId = "transfer-button";
  swapTransferMenuButtonId = "swap-transfer-button";
  sendTransferMenuButtonId = "transfer-send-button";
  receiveTransfertMenuButtonId = "transfer-receive-button";

  async open() {
    await tapById(this.transferButtonId);
  }

  async navigateToSwap() {
    await tapById(this.swapTransferMenuButtonId);
  }

  async navigateToSend() {
    await tapById(this.sendTransferMenuButtonId);
  }

  async navigateToStake() {
    await tapById(this.stakeMenuButtonId);
  }

  async navigateToReceive() {
    await tapById(this.receiveTransfertMenuButtonId);
  }
}
