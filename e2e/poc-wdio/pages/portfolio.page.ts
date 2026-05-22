import { getByTestIdMatching } from "../components/appiumSelector.ts";

export class PortfolioPage {
  // components
  public get screen() {
    return getByTestIdMatching(new RegExp("portfolio-screen|PortfolioReadOnlyItems"));
  }

  // steps
  async waitForPageToLoad() {
    await this.screen.waitForDisplayed();
  }
}
