import { openDeeplink, tapById, waitForElementById } from "../helpers";

export default class ReceivePage {
  noVerifyAddressButton = "button-DontVerify-my-address";
  noVerifyValidateButton = "button-confirm-dont-verify";
  receiveFreshAddress = "receive-fresh-address";

  openViaDeeplink() {
    return openDeeplink("receive");
  }
  async selectCurrency(currencyId: string) {
    const id = "big-currency-row-" + currencyId;
    await waitForElementById(id);
    await tapById(id);
  }
}
