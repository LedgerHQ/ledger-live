import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";

import type { ApplicationOptions } from "@e2e/page/index";
import type { OptionalFeatureMap } from "@shared/feature-flags";

/** Must stay in sync with `postOnboarding.actionsToComplete` in userdata/post-onboarding-hub-flow.json. */
export const MOCK_ACTIONS = [
  "assetsTransferMock",
  "syncAccountsMock",
  "discoverWalletMock",
] as const;

// Wallet 4.0 + onboardingWidget come from E2E defaults; only pin flags that would block the widget.
export const POST_ONBOARDING_FLAGS: OptionalFeatureMap = {
  protectServicesMobile: { enabled: false },
  lwmProductTour: { enabled: false },
  llmLedgerSyncEntryPoints: { enabled: false },
};

export const POST_ONBOARDING_USERDATA = "post-onboarding-hub-flow";

// i18n `postOnboarding.drawer.actionCompletedLabel`
export const ACTION_COMPLETED_LABEL = "Complete";

async function initApp(options: ApplicationOptions = {}) {
  await app.init({
    userdata: options.userdata ?? POST_ONBOARDING_USERDATA,
    featureFlags: { ...POST_ONBOARDING_FLAGS, ...options.featureFlags },
  });
  await app.mainNavigation.waitForWallet40Ready();
}

/**
 * B2CQA-6545. Mock post-onboarding hub flow — no Speculos; each step completes via
 * PostOnboardingMockActionScreen.
 */
export function runPostOnboardingHubFlowTest(tmsLinks: string[], tags: string[]) {
  describe("Post-onboarding hub", () => {
    beforeAll(async () => {
      await initApp();
    });

    setTeamOwner(Team.ENGAGEMENT);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it("Full post-onboarding hub flow — all mock steps", async () => {
      await app.postOnboardingHub.expectWidgetVisible();
      await app.postOnboardingHub.openHubFromWidget();

      for (const actionId of MOCK_ACTIONS) {
        await app.postOnboardingHub.expectActionPending(actionId);
        await app.postOnboardingHub.tapAction(actionId);
        await app.postOnboardingHub.completeMockActionAndReturnToHub();
        await app.postOnboardingHub.expectActionCompleted(actionId, ACTION_COMPLETED_LABEL);
      }

      await app.postOnboardingHub.expectAllActionsCompleted();
      await app.postOnboardingHub.tapCompleteButton();
      await app.postOnboardingHub.expectWidgetHidden();
    });
  });
}
