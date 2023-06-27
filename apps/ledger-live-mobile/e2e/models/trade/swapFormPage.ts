import {
  clearTextByElement,
  getElementById,
  openDeeplink,
  tapByElement,
  tapByText,
  typeTextByElement,
} from "../../helpers";

const baseLink = "swap";

export default class SwapFormPage {
  swapFormTab = () => getElementById("swap-form-tab");
  swapHistoryTab = () => getElementById("swap-history-tab");
  swapSourceSelector = () => getElementById("swap-source-selector");
  swapDestinationSelector = () => getElementById("swap-destination-selector");
  swapSourceInputTextbox = () => getElementById("swap-source-amount-textbox");
  exchangeButton = () => getElementById("exchange-button");
  sendMaxToggle = () => getElementById("exchange-send-max-toggle");
  termsAcceptButton = () => getElementById("terms-accept-button");
  termsCloseButton = () => getElementById("terms-close-button");

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async navigateToSwapForm() {
    await tapByElement(this.swapFormTab());
  }

  async navigateToSwapHistory() {
    await tapByElement(this.swapHistoryTab());
  }

  async openSourceAccountSelector() {
    await tapByElement(this.swapSourceSelector());
  }

  async openDestinationAccountSelector() {
    await tapByElement(this.swapDestinationSelector());
  }

  async selectAccount(accountText: string) {
    await tapByText(accountText);
  }

  async enterSourceAmount(amount: string) {
    await clearTextByElement(this.swapSourceInputTextbox());
    await typeTextByElement(this.swapSourceInputTextbox(), amount);
  }

  async sendMax() {
    await tapByElement(this.sendMaxToggle());
  }

  async startExchange() {
    await tapByElement(this.exchangeButton());
  }
}
