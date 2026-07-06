import { getByTestId } from "../components/appiumSelector";
import { step } from "@wdio/allure-reporter";

export class EarnPage {
  // components
  get earnScreen() {
    return getByTestId("earn-screen");
  }

  get walletApiWebview() {
    return getByTestId("wallet-api-webview");
  }

  // steps
  async openDeeplink() {
    const appIdentifier = await driver.getAppIdentifier();
    await step("Open earn via deeplink", async () => {
      await driver.deepLink("ledgerlive://earn", appIdentifier);
    });
  }

  async waitForSuccess() {
    await step("Wait for earn live app to load", async () => {
      // Earn renders as a full-screen webview (live app). The native "earn-screen"
      // container exists but XCUITest reports it as not displayed because the WKWebView
      // occludes it, so we wait for the live-app webview itself (same id switchToWebview uses).
      await this.walletApiWebview.waitForDisplayed({ timeout: 120_000 });
    });
  }
}
