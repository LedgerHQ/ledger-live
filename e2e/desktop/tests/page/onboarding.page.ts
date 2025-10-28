import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";

export class OnboardingPage extends AppPage {
  private getStartedButton = this.page.locator('button:has-text("Get Started")');
  private onboardingWelcomeTitle = this.page.getByTestId("onbording-welcome-title");

  @step("Wait for app to launch")
  async waitForLaunch() {
    await this.getStartedButton.waitFor({ state: "visible" });
    await this.onboardingWelcomeTitle.waitFor({ state: "visible" });
  }
}
