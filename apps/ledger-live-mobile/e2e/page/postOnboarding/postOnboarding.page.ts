export default class PostOnboardingPage {
  postOnboardingContainerId = "post-onboarding-hub-container";
  postOnboardingSkipButtonId = "post-onboarding-hub-skip-button";

  onboardingSkipButton = () => getElementById(this.postOnboardingSkipButtonId);

  async passThroughPostOnboarding() {
    await waitForElementById(this.postOnboardingContainerId);
    await tapByElement(this.onboardingSkipButton());
  }
}
