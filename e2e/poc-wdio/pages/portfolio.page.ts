import { getByTestIdMatching } from "../components/appiumSelector.ts";
import { step } from "@wdio/allure-reporter";
export class PortfolioPage {
  // components
  public get screen() {
    return getByTestIdMatching(new RegExp("portfolio-screen|PortfolioReadOnlyItems"));
  }

  // steps
  async waitForPageToLoad() {
    step("Wait for Portfolio page to load", async () => {
      await this.screen.waitForDisplayed();
    });
  }
}
