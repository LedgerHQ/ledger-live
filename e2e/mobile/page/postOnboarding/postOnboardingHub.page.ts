import { Step } from "jest-allure2-reporter/api";

export default class PostOnboardingHubPage {
  onboardingWidgetId = "onboarding-widget";
  hubContainerId = "post-onboarding-hub-container";
  mockCompleteAndBackToHubId = "post-onboarding-mock-complete-and-back-to-hub";
  hubCompleteButtonId = "post-onboarding-hub-complete-button";

  hubActionId = (actionId: string) => `post-onboarding-hub-action-${actionId}`;

  @Step("Expect onboarding widget to be visible")
  async expectWidgetVisible(): Promise<void> {
    await waitForFullyVisibleById(this.onboardingWidgetId);
  }

  @Step("Expect onboarding widget to be hidden")
  async expectWidgetHidden(): Promise<void> {
    await waitForElementNotVisible(this.onboardingWidgetId);
  }

  @Step("Open post-onboarding hub from portfolio widget")
  async openHubFromWidget(): Promise<void> {
    await tapById(this.onboardingWidgetId);
    await waitForFullyVisibleById(this.hubContainerId);
  }

  @Step("Expect hub action {{0}} to be pending")
  async expectActionPending(actionId: string): Promise<void> {
    await waitForFullyVisibleById(this.hubActionId(actionId));
  }

  @Step("Tap post-onboarding hub action {{0}}")
  async tapAction(actionId: string): Promise<void> {
    await tapById(this.hubActionId(actionId));
  }

  @Step("Complete mock action and return to post-onboarding hub")
  async completeMockActionAndReturnToHub(): Promise<void> {
    await waitForFullyVisibleById(this.mockCompleteAndBackToHubId);
    await tapById(this.mockCompleteAndBackToHubId);
    await waitForFullyVisibleById(this.hubContainerId);
  }

  @Step("Expect hub action {{0}} to be completed")
  async expectActionCompleted(actionId: string, completedLabel: string): Promise<void> {
    await waitForFullyVisibleById(this.hubActionId(actionId));
    await detoxExpect(
      getElementByIdWithDescendantTexts(this.hubActionId(actionId), completedLabel),
    ).toBeVisible();
  }

  @Step("Expect all post-onboarding hub actions to be completed")
  async expectAllActionsCompleted(): Promise<void> {
    await waitForFullyVisibleById(this.hubCompleteButtonId);
  }

  @Step("Tap post-onboarding hub complete button")
  async tapCompleteButton(): Promise<void> {
    await tapById(this.hubCompleteButtonId);
  }
}
