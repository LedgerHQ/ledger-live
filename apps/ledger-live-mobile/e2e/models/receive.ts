import { openDeeplink, tapById, waitForElementById } from "../helpers";

export default class ReceivePage {
  openViaDeeplink() {
    return openDeeplink("receive");
  }
  async selectCurrency(currencyId: string) {
    const id = "currency-row-" + currencyId;
    await waitForElementById(id);
    await tapById(id);
  }
}
