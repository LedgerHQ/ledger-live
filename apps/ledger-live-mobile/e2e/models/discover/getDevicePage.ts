import { web, by } from "detox";
import { getElementById, isAndroid, tapByElement } from "../../helpers";

export default class GetDevicePage {
  buyNanoButton = () => getElementById("getDevice-buy-button");

  async buyNano() {
    return tapByElement(this.buyNanoButton());
  }

  async expectBuyNanoWebPage() {
    if (isAndroid()) {
      const url = await web.element(by.web.id("__next")).getCurrentUrl();
      const expectedUrl = "https://shop.ledger.com/";

      expect(url).toContain(expectedUrl);
    } else {
      console.warn("Skipping webview check on iOS");
    }
  }
}
