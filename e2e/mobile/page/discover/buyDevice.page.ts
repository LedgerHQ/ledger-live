import { isAndroid } from "../../helpers/commonHelpers";

export default class BuyDevicePage {
  private readonly expectedUrl = "https://shop.ledger.com/";
  private readonly buyNanoButtonId = "getDevice-buy-button";

  @Step("Tap Buy Nano button")
  async buyNano(): Promise<void> {
    // getElementById now returns a Promise<NativeElement>
    const btn = await getElementById(this.buyNanoButtonId);
    await tapByElement(btn);
  }

  @Step("Verify Buy Nano web page is loaded")
  async expectBuyNanoWebPage(): Promise<void> {
    if (isAndroid()) {
      console.warn("Skipping webview URL check on Android");
      return;
    }
    // getWebElementById returns Promise<WebElement> on our helpers
    const webElem = getWebElementById("__next");
    // getCurrentUrl is async too
    const url = await webElem.getCurrentUrl();
    jestExpect(url).toContain(this.expectedUrl);
  }
}
