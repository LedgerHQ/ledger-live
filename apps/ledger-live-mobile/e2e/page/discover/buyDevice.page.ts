import { isAndroid } from "../../helpers/commonHelpers";

export default class BuyDevicePage {
  expectedUrl = "https://shop.ledger.com/";

  buyNanoButton = () => getElementById("getDevice-buy-button");

  async buyNano() {
    await tapByElement(this.buyNanoButton());
  }

  async expectBuyNanoWebPage() {
    // Webview testing is flaky on Android
    if (!isAndroid()) {
      const url = await getWebElementById("__next").getCurrentUrl();
      jestExpect(url).toContain(this.expectedUrl);
    } else {
      console.warn("Skipping webview check on Android");
    }
  }
}
