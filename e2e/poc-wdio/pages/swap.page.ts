export class SwapPage {
  // components

  // steps
  async openDeeplink() {
    await browser.url("ledgerlive://swap");
  }
}
