import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";
import { byId } from "@e2e-mobile/components/ElementHandle";
import { step } from "@wdio/allure-reporter";

export class SwapPage {
  // components
  private readonly swapSuccessTitle = byId("swap-success-title");
  private readonly closeButton = byId("NavigationHeaderCloseButton");
  private readonly exchangeError = byId("wallet-api-exchange-error");
  private readonly walletApiWebview = byId("wallet-api-webview");

  // steps
  async openDeeplink() {
    const appIdentifier = await driver.getAppIdentifier();
    await step("Open swap via deeplink", async () => {
      await driver.deepLink("ledgerlive://swap", appIdentifier);
    });
  }

  async waitForSuccessAndClose() {
    await step("Wait for swap success and close", async () => {
      await this.swapSuccessTitle.waitVisible(TIMEOUT.xxxlarge);
      await this.closeButton.waitVisible();
      await this.closeButton.tap();
      await this.swapSuccessTitle.waitNotVisible();
    });
  }

  async expectSwapPage() {
    await step("Expect swap page", async () => {
      await this.walletApiWebview.waitVisible();
    });
  }
}
