import { web, by } from "detox";
import { getElementById, isAndroid, tapByElement } from "../../helpers";

const expectedUrl = "https://shop.ledger.com/";

export default class BuyDevicePage {
  buyNanoButton = () => getElementById("getDevice-buy-button");

  async buyNano() {
    await tapByElement(this.buyNanoButton());
  }

  async expectBuyNanoWebPage() {
    // Webview testing is flaky on Android
    if (!isAndroid()) {
      const url = await web.element(by.web.id("__next")).getCurrentUrl();
      expect(url).toContain(expectedUrl);
    } else {
      console.warn("Skipping webview check on Android");
    }
  }
}
