import { act, screen, waitFor } from "@tests/test-renderer";
import { track } from "~/analytics";
import type { StakePromptCase } from "./stakePromptFixtures";
import { renderStakeFlow, setupStakePromptTestSuite } from "./stakePromptTestHarness";

export function describeStakePromptCaseChunk(cases: StakePromptCase[], part: number) {
  describe(`NotificationsPrompt stake flow part ${part}`, () => {
    setupStakePromptTestSuite();

    it.each(cases)(
      "should prompt the notifications drawer when closing $label validation success",
      async stakePromptCase => {
        const { user } = renderStakeFlow(stakePromptCase);

        expect(track).not.toHaveBeenCalledWith(
          "attempt_to_trigger_push_notification_drawer_after_action",
          expect.any(Object),
        );

        await waitFor(() => expect(screen.getByTestId("validate-success-screen")).toBeVisible());
        await user.press(screen.getByTestId("enabled-success-close-button"));
        await act(async () => {
          await jest.runOnlyPendingTimersAsync();
        });

        await waitFor(() => expect(screen.getByText(/allow notifications/i)).toBeVisible());
        expect(track).toHaveBeenCalledWith(
          "attempt_to_trigger_push_notification_drawer_after_action",
          {
            action: "stake",
            shouldPrompt: true,
            repromptDelay: null,
            dismissedCount: 0,
            skipReason: undefined,
            drawerPromptTarget: "globalPushNotifications",
          },
        );

        await user.press(screen.getByText(/allow notifications/i));
        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "allow notifications",
          page: "Drawer push notification opt-in",
          source: "stake",
          drawerPromptTarget: "globalPushNotifications",
          repromptDelay: null,
          dismissedCount: 0,
        });
      },
    );

    it.each(cases.filter(c => c.errorScreenName))(
      "should not prompt the notifications drawer when closing $label validation error",
      async stakePromptCase => {
        const { user } = renderStakeFlow(stakePromptCase, stakePromptCase.errorScreenName!);

        expect(track).not.toHaveBeenCalledWith(
          "attempt_to_trigger_push_notification_drawer_after_action",
          expect.any(Object),
        );

        await waitFor(() => expect(screen.getByTestId("SendErrorClose")).toBeVisible());
        await user.press(screen.getByTestId("SendErrorClose"));
        await act(async () => {
          await jest.runOnlyPendingTimersAsync();
        });

        expect(track).not.toHaveBeenCalledWith(
          "attempt_to_trigger_push_notification_drawer_after_action",
          expect.any(Object),
        );
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
      },
    );
  });
}
