import { getByTestId } from "../components/appiumSelector";
import { step } from "@wdio/allure-reporter";

export class SwapPage {
  // components
  get swapSuccessTitle() {
    return getByTestId("swap-success-title");
  }

  // steps
  async openDeeplink() {
    const appIdentifier = await driver.getAppIdentifier();
    await step("Open swap via deeplink", async () => {
      await driver.deepLink("ledgerlive://swap", appIdentifier);
    });
  }

  async waitForSuccess() {
    await step("Wait for swap success", async () => {
      await this.swapSuccessTitle.waitForDisplayed({ timeout: 120_000 });
      // TODO: find alternative for "errorElementId" -> deviceActionErrorDescriptionId
    });
  }
}
