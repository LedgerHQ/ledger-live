import { AppPage } from "tests/page/abstractClasses";

export class OnboardingPage extends AppPage {
  private readonly getStartedButton = this.page.locator('button:has-text("Get Started")');
  private readonly acceptAnalyticsButton = this.page.getByTestId("accept-analytics-button");
  readonly continueButton = this.page.locator('button:has-text("Continue")');
  private readonly onbordingWelcomeTitle = this.page.getByTestId("onbording-welcome-title");

  async waitForLaunch() {
    await this.getStartedButton.waitFor({ state: "visible" });
    await this.onbordingWelcomeTitle.waitFor({ state: "visible" });
  }

  async getStarted() {
    await this.getStartedButton.click();

    // Click on accept analytics button if it exists
    await this.acceptAnalyticsButton.click().catch(() => {});
  }

  async continue() {
    await this.continueButton.click();
  }
}
