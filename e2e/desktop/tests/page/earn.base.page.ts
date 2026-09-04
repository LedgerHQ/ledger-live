import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "tests/page/webViewApp.page";

export abstract class EarnBasePage extends WebViewAppPage {
  protected readonly webviewIdentifier = "earn";
  private readonly earnAppContainer = this.page.getByTestId("earn-app-container");

  @step("Go and wait for Earn app to be ready")
  async goAndWaitForEarnToBeReady(earnFunction: () => Promise<void>) {
    this._webviewPage = undefined;
    await earnFunction();
    await this.earnAppContainer.waitFor();
    await this.getWebView();
  }
}
