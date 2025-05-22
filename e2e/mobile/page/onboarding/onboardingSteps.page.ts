export default class OnboardingStepsPage {
  getStartedButtonId = "onboarding-getStarted-button";
  acceptAnalyticsButtonId = "accept-analytics-button";
  exploreWithoutDeviceButtonId = "discoverLive-exploreWithoutADevice";
  setupLedger = "onboarding-setupLedger";
  recoveryPhrase = "onboarding-useCase-recoveryPhrase";

  discoverLiveTitle = (index: number) => `onboarding-discoverLive-${index}-title`;
  onboardingGetStartedButton = () => getElementById(this.getStartedButtonId);
  acceptAnalyticsButton = () => getElementById(this.acceptAnalyticsButtonId);
  noLedgerYetButton = () => getElementById("onboarding-noLedgerYet");
  exploreAppButton = () => getElementById("onboarding-noLedgerYetModal-explore");

  @Step("Start onboarding")
  async startOnboarding(): Promise<void> {
    await waitForElementById(this.getStartedButtonId);
    const getStarted = this.onboardingGetStartedButton();
    await tapByElement(getStarted);
    await waitForElementById(new RegExp(`${this.setupLedger}|${this.acceptAnalyticsButtonId}`));
    try {
      const analyticsBtn = this.acceptAnalyticsButton();
      await tapByElement(analyticsBtn);
    } catch {
      // Analytics prompt not enabled
    }
  }

  @Step("Choose no ledger yet")
  async chooseNoLedgerYet(): Promise<void> {
    const btn = this.noLedgerYetButton();
    await tapByElement(btn);
  }

  @Step("Choose to explore app")
  async chooseToExploreApp(): Promise<void> {
    const exploreBtn = this.exploreAppButton();
    await tapByElement(exploreBtn);
    for (let i = 0; i < 4; i++) {
      const titleId = this.discoverLiveTitle(i);
      await tapById(titleId);
    }
    await tapById(this.exploreWithoutDeviceButtonId);
  }
}
