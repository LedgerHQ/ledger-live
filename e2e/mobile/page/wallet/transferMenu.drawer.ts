export default class TransferMenuDrawer {
  swapMenuButtonId = "transfer-swap-button";
  buyMenuButtonId = "transfer-buy-button";
  sellMenuButtonId = "transfer-sell-button";
  transferButtonId = "transfer-button";

  async open() {
    await tapById(this.transferButtonId);
  }

  async navigateToSwap() {
    await tapById(this.swapMenuButtonId);
  }

  async navigateToBuy() {
    await tapById(this.buyMenuButtonId);
  }

  async navigateToSell() {
    await tapById(this.sellMenuButtonId);
  }
}
