export default class TransferMenuDrawer {
  stakeMenuButtonId = "transfer-stake-button";
  transferButtonId = "transfer-button";
  receiveTransferMenuButtonId = "transfer-receive-button";

  async open() {
    await tapById(this.transferButtonId);
  }

  async navigateToStake() {
    await tapById(this.stakeMenuButtonId);
  }

  async navigateToReceive() {
    await tapById(this.receiveTransferMenuButtonId);
  }
}
