import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";

export class OnboardingPage extends AppPage {
  private getStartedButton = this.page.getByTestId("v3-onboarding-get-started-button");
  private buyDeviceButton = this.page.getByTestId("onboarding-device-button");

  @step("Wait for app to launch")
  async waitForLaunch() {
    await this.getStartedButton.waitFor({ state: "visible" });
    await this.buyDeviceButton.waitFor({ state: "visible" });
  }
}
