import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";
import {
  ACTION_COMPLETED_LABEL,
  MOCK_ACTIONS,
  POST_ONBOARDING_FLAGS,
  POST_ONBOARDING_USERDATA,
} from "./postOnboardingHub";

/**
 * B2CQA-6545. Mock post-onboarding widget flow — no Speculos; each step completes via
 * PostOnboardingMockAction side drawer.
 */
test.describe("Post-onboarding hub", () => {
  test.use({
    teamOwner: Team.ENGAGEMENT,
    userdata: POST_ONBOARDING_USERDATA,
    featureFlags: POST_ONBOARDING_FLAGS,
  });

  test(
    "Full post-onboarding widget flow — all mock steps",
    {
      tag: [...DEVICE_TAGS, "@postOnboarding"],
      annotation: { type: "TMS", description: "B2CQA-6545" },
    },
    async ({ app }) => {
      await addTmsLink(["B2CQA-6545"]);

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
        await app.postOnboarding.expectActionCompleted(actionId, ACTION_COMPLETED_LABEL);
      }

      await app.postOnboarding.expectWidgetHidden();
    },
  );
});
