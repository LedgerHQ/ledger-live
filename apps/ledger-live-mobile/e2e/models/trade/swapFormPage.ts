import {
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
  swapSourceInputTextbox = () => getElementById("swap-source-amount-textbox");

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

  async selectSourceAccount(accountText: string) {
    await tapByText(accountText);
  }

  async enterSourceAmount(amount: string) {
    await typeTextByElement(this.swapSourceInputTextbox(), amount);
  }
}
