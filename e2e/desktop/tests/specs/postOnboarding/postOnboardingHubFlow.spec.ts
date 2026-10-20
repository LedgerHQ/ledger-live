import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { FF_POST_ONBOARDING_MOCK_DESKTOP } from "tests/utils/featureFlagUtils";
import { deviceTagsWithoutLNS } from "tests/utils/tagsUtils";
import { PostOnboardingActionId } from "@ledgerhq/types-live";

/** Must stay in sync with `postOnboarding.actionsToComplete` in userdata/post-onboarding-hub-flow.json. */
const MOCK_ACTIONS = [
  PostOnboardingActionId.claimMock,
  PostOnboardingActionId.personalizeMock,
  PostOnboardingActionId.migrateAssetsMock,
];

/**
 * B2CQA-6545. Mock post-onboarding widget flow — no Speculos; each step completes via
 * PostOnboardingMockAction side drawer.
 */
test.describe("Post-onboarding hub", () => {
  test.use({
    teamOwner: Team.ENGAGEMENT,
    userdata: "post-onboarding-hub-flow",
    featureFlags: FF_POST_ONBOARDING_MOCK_DESKTOP,
  });

  test(
    "Full post-onboarding widget flow — all mock steps",
    {
      tag: [...deviceTagsWithoutLNS(), "@postOnboarding"],
      annotation: { type: "TMS", description: "B2CQA-6545" },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.postOnboarding.expectWidgetVisible();
      await app.postOnboarding.openDialogFromWidget();

      const lastActionId = MOCK_ACTIONS.at(-1);

      for (const actionId of MOCK_ACTIONS) {
        const isLast = actionId === lastActionId;

        await app.postOnboarding.expectActionPending(actionId);
        await app.postOnboarding.clickAction(actionId);
        await app.postOnboarding.completeMockAction();

        if (isLast) break;

        await app.postOnboarding.expectWidgetVisible();
        await app.postOnboarding.openDialogFromWidget();
        await app.postOnboarding.expectActionCompleted(actionId);
      }

      await app.postOnboarding.expectWidgetHidden();
    },
  );
});
