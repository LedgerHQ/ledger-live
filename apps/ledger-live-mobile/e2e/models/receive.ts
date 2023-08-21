import { openDeeplink, tapById, waitForElementById } from "../helpers";

export default class ReceivePage {
  openViaDeeplink() {
    return openDeeplink("receive");
  }
  async selectCurrency(currencyId: string) {
    const id = "big-currency-row-" + currencyId;
    await waitForElementById(id);
    await tapById(id);
  }
}
