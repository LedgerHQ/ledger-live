import { getByTestId } from "../components/appiumSelector.ts";
import allureReporter from "@wdio/allure-reporter";

export class OnboardingPage {
  // components
  public get getStartedButton() {
    return getByTestId("onboarding-getStarted-button");
  }

  // steps
  async expectGetStartedButtonToBeDisplayed(): Promise<void> {
    allureReporter.addStep("Expect Get Started button to be displayed");
    await expect(this.getStartedButton).toBeDisplayed();
  }
}
