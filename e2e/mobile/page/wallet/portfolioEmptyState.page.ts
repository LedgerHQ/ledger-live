export default class PortfolioEmptyStatePage {
  receiveButtonId = "receive-button";

  @Step("Open receive drawer from empty portfolio")
  async navigateToReceive() {
    await tapById(this.receiveButtonId);
  }
}
