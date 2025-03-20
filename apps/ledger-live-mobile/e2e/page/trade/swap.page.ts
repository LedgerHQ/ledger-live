import { expect } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class SwapPage {
  baseLink = "swap";
  swapFormTab = () => getElementById("swap-form-tab");
  swapHistoryTab = () => getElementById("swap-history-tab");
  swapSourceSelector = () => getElementById("swap-source-selector");
  swapDestinationSelector = () => getElementById("swap-destination-selector");
  swapSourceInputTextbox = () => getElementById("swap-source-amount-textbox");
  exchangeButton = () => getElementById("exchange-button");
  exchangeScrollView = () => getElementById("exchange-scrollView");
  chooseProviderButton = () => getElementById("choose-provider-button");
  sendMaxToggle = () => getElementById("exchange-send-max-toggle");
  termsAcceptButton = () => getElementById("terms-accept-button");
  termsCloseButton = () => getElementById("terms-close-button");

  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  async expectSwapPage() {
    await expect(this.swapFormTab()).toBeVisible();
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

  async goToProviderSelection() {
    await tapByElement(this.chooseProviderButton());
  }

  async chooseProvider(providerName: string) {
    await tapByText(providerName);
  }

  async sendMax() {
    await tapByElement(this.sendMaxToggle());
  }

  async startExchange() {
    await this.exchangeScrollView().scrollTo("bottom");
    await tapByElement(this.exchangeButton());
  }

  async expectNoMaxToggle() {
    await expect(this.sendMaxToggle()).not.toExist();
  }

  async expectTerms() {
    await expect(this.termsAcceptButton()).toBeVisible();
    await expect(this.termsCloseButton()).toBeVisible();
  }
}
