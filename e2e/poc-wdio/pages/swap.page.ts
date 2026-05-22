export class SwapPage {
  // components

  // steps
  async openDeeplink() {
    await driver.deepLink(
      "ledgerlive://swap",
      // TODO: store app or bundle ID in a central reference
      `com.ledger.live${driver.isAndroid ? ".detox" : ""}`,
    );
  }
}
