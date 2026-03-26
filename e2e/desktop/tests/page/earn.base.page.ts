import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "./webViewApp.page";

export abstract class EarnBasePage extends WebViewAppPage {
  protected readonly webviewIdentifier = "earn";

  @step("Go and wait for Earn app to be ready")
  async goAndWaitForEarnToBeReady(earnFunction: () => Promise<void>) {
    const appReadyPromise = new Promise<void>(resolve => {
      this.page.on("console", msg => {
        if (msg.type() === "info" && msg.text().includes("Earn Live App Loaded")) {
          resolve();
        }
      });
    });

    await earnFunction();
    await appReadyPromise;

    const webview = await this.getWebView();
    await webview.getByTestId(this.loadingSkeleton).first().waitFor({ state: "hidden" });
  }

  @step("Verify provider URL")
  async verifyProviderURL(selectedProvider: string, account: Account) {
    const newWindow = await this.waitForNewWindow();
    const url = newWindow.url();

    switch (selectedProvider) {
      case "Lido": {
        await this.expectUrlToContainAll(url, [account.currency.id, "stake.lido.fi"]);
        break;
      }
      case "Stader Labs": {
        const expectedStringArray = [
          account.currency.id,
          `staderlabs.com/${account.currency.ticker}`,
          ...(account.address ? [account.address] : []),
        ];
        await this.expectUrlToContainAll(url, expectedStringArray);
        break;
      }
      case "Kiln staking Pool": {
        await this.expectUrlToContainAll(url, [
          account.currency.id,
          "ledger-staking.widget.kiln.fi/earn",
          "focus=pooled",
          account.address!,
        ]);
        break;
      }
      default:
        throw new Error(`Unknown provider: ${selectedProvider}`);
    }
  }
}
