import { getByTestId } from "../components/appiumSelector";

export class SwapPage {
  // components
  get swapSuccessTitle() {
    return getByTestId("swap-success-title");
  }

  // steps
  async openDeeplink() {
    await driver.deepLink(
      "ledgerlive://swap",
      // TODO: store app or bundle ID in a central reference
      `com.ledger.live${driver.isAndroid ? ".detox" : ""}`,
    );
  }

  async waitForSuccess() {
    await this.swapSuccessTitle.waitForDisplayed({ timeout: 120_000 });
    // TODO: find alternative for "errorElementId" -> deviceActionErrorDescriptionId
  }
}
