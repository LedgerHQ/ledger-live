import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { step } from "../misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { ElectronApplication } from "@playwright/test";

export class EarnPage extends AppPage {
  private earnMoreRewardButton = "tab-earn-more";
  private learnMoreButton = (currency: string) => `get-${currency}-button`;

  @step("Go and wait for Earn app to be ready")
  async goAndWaitForEarnToBeReady(earnFunction: () => Promise<void>) {
    // todo: uncomment when the custom method is merged

    // const appReadyPromise = new Promise<void>(resolve => {
    //   this.page.on("console", msg => {
    //     if (msg.type() === "info" && msg.text().includes("Earn Live App Loaded")) {
    //       resolve();
    //     }
    //   });
    // });

    await earnFunction();

    //await appReadyPromise;
  }

  @step("Click on earn more rewards button")
  async clickEarnMoreButton(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    // const buttonLocator = webview.getByTestId(this.earnMoreRewardButton);
    // await buttonLocator.click();
    await webview.getByRole("link", { name: "Earn more rewards" }).click(); // todo: uncomment when the custom method is merged
  }

  @step("Click on stake button for $1")
  async clickStakeCurrencyButton(electronApp: ElectronApplication, account: string) {
    const [, webview] = electronApp.windows();
    const row = await webview.locator("tr", { hasText: `${account}` });
    console.log("Row:", row);
    await row.getByRole("button", { name: "Earn" }).first().click(); //todo: remove le .first() en targetant mieux la bonne ligne
  }

  @step("Verify provider URL")
  async verifyProviderURL(
    electronApp: ElectronApplication,
    selectedProvider: string,
    account: Account,
  ) {
    const newWindow = await electronApp.waitForEvent("window");

    await newWindow.waitForLoadState();

    const url = newWindow.url();

    switch (selectedProvider) {
      case "Lido": {
        this.expectUrlToContainAll(url, [account.currency.id, "stake.lido.fi"]);
        break;
      }
      case "Stader Labs": {
        this.expectUrlToContainAll(url, [
          account.currency.id,
          `staderlabs.com/${account.currency.ticker}`,
          account.address,
        ]);
        break;
      }
      case "Kiln staking Pool": {
        this.expectUrlToContainAll(url, [account.currency.id, "kiln.fi%2F%3Ffocus%3Dpooled"]);
        break;
      }
      default:
        throw new Error(`Unknown provider: ${selectedProvider}`);
    }
  }

  @step("Click on learn more button for $1")
  async clickLeanrMoreButton(electronApp: ElectronApplication, currency: string) {
    const [, webview] = electronApp.windows();
    const buttonLocator = webview.getByTestId(this.learnMoreButton(currency));
    await buttonLocator.click();
  }
}
