import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { ElectronApplication, expect } from "@playwright/test";

export class BuyAndSellPage extends AppPage {
  private buyAndSellPage = "navigation-tabs";

  @step("Expect buy and sell screen to be visible")
  async verifyBuySellScreen(electronApp: ElectronApplication) {
    const newWindow = await electronApp.waitForEvent("window");
    await newWindow.waitForLoadState();
    const [, webview] = electronApp.windows();

    await expect(webview.getByTestId(this.buyAndSellPage)).toBeVisible();
  }
}
