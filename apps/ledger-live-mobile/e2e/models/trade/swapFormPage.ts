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
  chooseProviderButton = () => getElementById("choose-provider-button");
  sendMaxToggle = () => getElementById("exchange-send-max-toggle");
  termsAcceptButton = () => getElementById("terms-accept-button");
  termsCloseButton = () => getElementById("terms-close-button");

  openViaDeeplink() {
    return openDeeplink(baseLink);
  }

  navigateToSwapForm() {
    return tapByElement(this.swapFormTab());
  }

  navigateToSwapHistory() {
    return tapByElement(this.swapHistoryTab());
  }

  openSourceAccountSelector() {
    return tapByElement(this.swapSourceSelector());
  }

  openDestinationAccountSelector() {
    return tapByElement(this.swapDestinationSelector());
  }

  selectAccount(accountText: string) {
    return tapByText(accountText);
  }

  async enterSourceAmount(amount: string) {
    await clearTextByElement(this.swapSourceInputTextbox());
    await typeTextByElement(this.swapSourceInputTextbox(), amount);
  }

  goToProviderSelection() {
    return tapByElement(this.chooseProviderButton());
  }

  chooseProvider(providerName: string) {
    return tapByText(providerName);
  }

  sendMax() {
    return tapByElement(this.sendMaxToggle());
  }

  startExchange() {
    return tapByElement(this.exchangeButton());
  }
}
