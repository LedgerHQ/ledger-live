import { getByTestId } from "../components/appiumSelector";
import { step } from "@wdio/allure-reporter";

export class CommonPage {
  // components
  get proceedButton() {
    return getByTestId("proceed-button");
  }

  // steps
  async tapProceed() {
    await step("Tap proceed button", async () => {
      await this.proceedButton.tap();
    });
  }
}
