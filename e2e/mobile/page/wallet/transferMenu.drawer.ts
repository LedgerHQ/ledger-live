export default class TransferMenuDrawer {
  swapMenuButtonId = "transfer-swap-button";
  buyMenuButtonId = "transfer-buy-button";
  transferButtonId = "transfer-button";
  stakeMenuButtonId = "transfer-stake-button";

  async open() {
    await tapById(this.transferButtonId);
  }

  async navigateToSwap() {
    await tapById(this.swapMenuButtonId);
  }

  async navigateToBuy() {
    await tapById(this.buyMenuButtonId);
  }

  async navigateToStake() {
    await tapById(this.stakeMenuButtonId);
  }
}
