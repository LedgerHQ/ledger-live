import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import { ElectronApplication, expect } from "@playwright/test";

export class LiveApp extends AppPage {
  readonly liveAppTitle = this.page.getByTestId("live-app-title");

  @step("Verify live app title contains $0")
  async verifyLiveAppTitle(provider: string) {
    const liveApp = await this.liveAppTitle.textContent();
    expect(liveApp?.toLowerCase()).toContain(provider);
  }

  @step("Verify live app contains account to debit: $0")
  async verifyAccountToDebit(account: string) {
    const liveApp = await this.liveAppTitle.textContent(); //voir commment mettre le locator pour recup le nom du compte
    expect(liveApp).toContain(account);
  }

  @step("Go and wait for Swap app to be ready")
  async check1inch(electronApp: ElectronApplication, provider: string) {
    const [, webview] = electronApp.windows();
    const successfulQuery = new Promise(resolve => {
      webview.on("response", response => {
        if (
          response
            .url()
            .startsWith("https://proxy-app.1inch.io/v2.0/v1.5/chain/1/router/v5/quotes") &&
          response.status() === 200
        ) {
          resolve(response);
        }
      });
    });

    await this.verifyLiveAppTitle(provider);
    expect(await successfulQuery).toBeDefined();
  }
}
