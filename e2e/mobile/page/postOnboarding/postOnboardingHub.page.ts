import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";

export default class PostOnboardingHubPage {
  private readonly onboardingWidget = byId("onboarding-widget");
  private readonly hubContainer = byId("post-onboarding-hub-container");
  private readonly mockCompleteAndBackToHub = byId("post-onboarding-mock-complete-and-back-to-hub");
  private readonly hubCompleteButton = byId("post-onboarding-hub-complete-button");
  private readonly hubAction = (actionId: string) => byId(`post-onboarding-hub-action-${actionId}`);
  private readonly hubActionDescription = (actionId: string) =>
    byId(`post-onboarding-hub-action-${actionId}-description`);

  @Step("Expect onboarding widget to be visible")
  async expectWidgetVisible(): Promise<void> {
    await this.onboardingWidget.waitFullyVisible();
  }

  @Step("Expect onboarding widget to be hidden")
  async expectWidgetHidden(): Promise<void> {
    await this.onboardingWidget.waitNotVisible();
  }

  @Step("Open post-onboarding hub from portfolio widget")
  async openHubFromWidget(): Promise<void> {
    await this.onboardingWidget.tap();
    await this.hubContainer.waitFullyVisible();
  }

  @Step("Expect hub action {{0}} to be pending")
  async expectActionPending(actionId: string): Promise<void> {
    await this.hubAction(actionId).waitFullyVisible();
  }

  @Step("Tap post-onboarding hub action {{0}}")
  async tapAction(actionId: string): Promise<void> {
    await this.hubAction(actionId).tap();
  }

  @Step("Complete mock action and return to post-onboarding hub")
  async completeMockActionAndReturnToHub(): Promise<void> {
    await this.mockCompleteAndBackToHub.tap();
    await this.hubContainer.waitFullyVisible();
  }

  @Step("Expect hub action {{0}} to be completed")
  async expectActionCompleted(actionId: string, completedLabel: string): Promise<void> {
    await this.hubAction(actionId).waitFullyVisible();
    await this.hubActionDescription(actionId).expectText(completedLabel);
  }

  @Step("Expect all post-onboarding hub actions to be completed")
  async expectAllActionsCompleted(): Promise<void> {
    await this.hubCompleteButton.waitFullyVisible();
  }

  @Step("Tap post-onboarding hub complete button")
  async tapCompleteButton(): Promise<void> {
    await this.hubCompleteButton.tap();
  }
}
