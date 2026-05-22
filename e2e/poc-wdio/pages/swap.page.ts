export class SwapPage {
  // components

  // steps
  async openDeeplink() {
    await browser.deepLink(
      "ledgerlive://swap",
      // TODO: store app or bundle ID in a central reference
      `com.ledger.live${browser.isAndroid ? ".detox" : ""}`,
    );
  }
}
