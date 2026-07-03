import { getByTestId } from "../components/appiumSelector.ts";
import { step } from "@wdio/allure-reporter";

type Wallet40TabName = "home" | "swap" | "earn" | "card";

export class MainNavigationPage {
  get topBarMyWallet() {
    return getByTestId("topbar-mywallet");
  }

  get earnScreen() {
    return getByTestId("earn-screen");
  }

  wallet40Tab(tabName: Wallet40TabName) {
    return getByTestId(`w40-tab-${tabName}`);
  }

  async waitForWallet40Ready(timeout = 60_000) {
    await step("Wait for Wallet 4.0 navigation to be ready", async () => {
      await this.topBarMyWallet.waitForDisplayed({ timeout });
    });
  }

  async tapWallet40Tab(tabName: Wallet40TabName) {
    await step(`Tap Wallet 4.0 tab: ${tabName}`, async () => {
      await this.wallet40Tab(tabName).click();
    });
  }

  async expectEarnPageVisible() {
    await step("Expect Earn page to be visible", async () => {
      await this.earnScreen.waitForDisplayed();
    });
  }
}
