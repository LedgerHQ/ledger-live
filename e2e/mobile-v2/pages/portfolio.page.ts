import { byIdMatching } from "@e2e-mobile/components/ElementHandle";
import { step } from "@wdio/allure-reporter";
export class PortfolioPage {
  // components
  private readonly screen = byIdMatching(new RegExp("portfolio-screen|PortfolioReadOnlyItems"));

  // steps
  async waitForPageToLoad() {
    await step("Wait for Portfolio page to load", async () => {
      await this.screen.waitVisible();
    });
  }
}
