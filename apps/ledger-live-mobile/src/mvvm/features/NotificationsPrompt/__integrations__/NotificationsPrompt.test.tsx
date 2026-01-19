import React from "react";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import { useNotifications } from "../hooks/useNotifications";

import storage from "LLM/storage";
import { add, type Duration } from "date-fns";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { NotificationsPromptDrawer } from "../screens/NotificationsPromptDrawer";

const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
  EPHEMERAL: 3,
} as const;

type AuthorizationStatusType = (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];

const mockRequestPermission = jest.fn<Promise<AuthorizationStatusType>, []>(() =>
  Promise.resolve(AuthorizationStatus.AUTHORIZED),
);
const mockHasPermission = jest.fn<Promise<AuthorizationStatusType>, []>(() =>
  Promise.resolve(AuthorizationStatus.AUTHORIZED),
);

jest.mock("@react-native-firebase/messaging", () => {
  const AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    EPHEMERAL: 3,
  } as const;
  return {
    AuthorizationStatus,
    getMessaging: jest.fn(() => ({
      requestPermission: mockRequestPermission,
      hasPermission: mockHasPermission,
    })),
  };
});

const REPROMPT_SCHEDULE = [{ months: 1 }, { months: 3 }, { months: 6 }] as const;

jest.mock("@ledgerhq/live-common/featureFlags/useFeature", () => {
  return jest.fn(name => {
    if (name === "brazePushNotifications") {
      return {
        enabled: true,
        params: {
          action_events: {
            complete_onboarding: {
              enabled: true,
              timer: 0,
            },

            add_favorite_coin: {
              enabled: true,
              timer: 0,
            },

            send: {
              enabled: true,
              timer: 0,
            },
            receive: {
              enabled: true,
              timer: 0,
            },
            buy: {
              enabled: true,
              timer: 0,
            },
            swap: {
              enabled: true,
              timer: 0,
            },
            stake: {
              enabled: true,
              timer: 0,
            },
          },
          reprompt_schedule: REPROMPT_SCHEDULE,

          notificationsCategories: [
            {
              displayed: true,
              category: "announcementsCategory",
            },
            {
              displayed: true,
              category: "recommendationsCategory",
            },
            {
              displayed: true,
              category: "largeMoverCategory",
            },
            {
              displayed: true,
              category: "transactionsAlertsCategory",
            },
          ],
          trigger_events: [
            {
              route_name: "PortfolioNavigator",
              timer: 3000,
              type: "on_enter",
            },
            {
              route_name: "Wallet",
              timer: 3000,
              type: "on_enter",
            },
          ],

          marketCoinStarred: {
            enabled: true,
            timer: 3000,
          },
          justFinishedOnboarding: {
            enabled: true,
            timer: 3000,
          },
          conditions: {
            default_delay_between_two_prompts: {
              seconds: 10,
            },
            maybe_later_delay: {
              seconds: 10,
            },
            minimum_accounts_with_funds_number: 1,
            minimum_app_starts_number: 1,
            minimum_duration_since_app_first_start: {
              seconds: 10,
            },
          },
        },
      };
    }

    if (name === "lwmNewWordingOptInNotificationsDrawer") {
      return {
        enabled: true,
        params: {
          variant: ABTestingVariants.variantA,
        },
      };
    }

    console.warn(`Unhandled feature flag: ${name}`);

    return {
      enabled: true,
    };
  });
});

describe("NotificationsPrompt Integration", () => {
  async function setup({
    osPermission,
    appNotifications,
  }: {
    osPermission: AuthorizationStatusType;
    appNotifications: boolean;
  }) {
    mockHasPermission.mockResolvedValue(osPermission);
    mockRequestPermission.mockResolvedValue(osPermission);

    function SetupComponent() {
      const {
        tryTriggerPushNotificationDrawerAfterAction,
        permissionStatus,
        pushNotificationsDataOfUser,
      } = useNotifications();

      const isReady = pushNotificationsDataOfUser && permissionStatus !== undefined;

      if (!isReady) {
        return <Text>Loading permission status and push notifications data of user</Text>;
      }

      return (
        <Button onPress={() => tryTriggerPushNotificationDrawerAfterAction("onboarding")}>
          Trigger drawer
        </Button>
      );
    }

    const rendered = render(
      <>
        <NotificationsPromptDrawer />
        <SetupComponent />
      </>,
      {
        overrideInitialState: state => {
          state.settings.notifications.areNotificationsAllowed = appNotifications;
          return state;
        },
      },
    );

    const tryTriggerDrawer = async () => {
      const triggerDrawerButton = await screen.findByRole("button", { name: /trigger drawer/i });
      await rendered.user.press(triggerDrawerButton);
      act(() => jest.runOnlyPendingTimers());
    };

    await waitFor(() => {
      expect(
        screen.queryByText(/Loading permission status and push notifications data of user/i),
      ).not.toBeOnTheScreen();
    });

    return {
      ...rendered,
      tryTriggerDrawer,
    };
  }

  beforeEach(async () => {
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

    mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
    mockHasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);

    await storage.deleteAll();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const advanceTime = (duration: Duration) => {
    const now = Date.now();
    const durationInMs = add(now, duration).getTime() - now;
    act(() => jest.advanceTimersByTime(durationInMs));
  };

  describe("first time prompt", () => {
    describe("os not determined", () => {
      it("app notifications = false, should prompt immediately", async () => {
        const { tryTriggerDrawer } = await setup({
          osPermission: AuthorizationStatus.NOT_DETERMINED,
          appNotifications: false,
        });

        await tryTriggerDrawer();
        expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
      });

      it("app notifications = true, should prompt immediately", async () => {
        const { tryTriggerDrawer } = await setup({
          osPermission: AuthorizationStatus.NOT_DETERMINED,
          appNotifications: true,
        });

        await tryTriggerDrawer();
        expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
      });
    });

    describe("os denied", () => {
      it("app notifications = false, should not prompt immediately, then prompt after delay", async () => {
        const { tryTriggerDrawer } = await setup({
          osPermission: AuthorizationStatus.DENIED,
          appNotifications: false,
        });

        await tryTriggerDrawer();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

        advanceTime(REPROMPT_SCHEDULE[0]);

        await tryTriggerDrawer();
        expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
      });

      it("app notifications = true, should not prompt immediately, then prompt after delay", async () => {
        const { tryTriggerDrawer } = await setup({
          osPermission: AuthorizationStatus.DENIED,
          appNotifications: true,
        });

        await tryTriggerDrawer();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

        advanceTime(REPROMPT_SCHEDULE[0]);

        await tryTriggerDrawer();
        expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
      });
    });

    describe("os authorized", () => {
      it("app notifications = true, should never prompt", async () => {
        const { tryTriggerDrawer } = await setup({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: true,
        });

        await tryTriggerDrawer();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

        advanceTime(REPROMPT_SCHEDULE[0]);

        await tryTriggerDrawer();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

        advanceTime(REPROMPT_SCHEDULE[1]);
        await tryTriggerDrawer();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
      });

      it.skip("app notifications = false, should not prompt immediately", () => {
        // this can only be tested E2E since the user will have to go to the settings to disable app notifications
        // when the user opts out of app notifications, he will be marked as opted out and will be prompted later based on reprompt_schedule
      });
    });
  });

  describe("multiple reprompts", () => {
    it("should never reprompt ever again when user finally opts in notifications", async () => {
      const { tryTriggerDrawer, user } = await setup({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: true,
      });

      await tryTriggerDrawer();
      const allowNotificationsButton = screen.getByText(/allow notifications/i);
      expect(allowNotificationsButton).toBeOnTheScreen();

      mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
      mockHasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
      await user.press(allowNotificationsButton);
      await waitFor(() => expect(allowNotificationsButton).not.toBeOnTheScreen());

      advanceTime({
        years: 999,
      });
      await tryTriggerDrawer();
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

      advanceTime({
        years: 999,
      });
      await tryTriggerDrawer();
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
    });

    it("should reprompt after each delay when user opts out notifications by clicking on maybe later text", async () => {
      const { tryTriggerDrawer, user } = await setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: false,
      });

      await tryTriggerDrawer();
      const maybeLaterButton = screen.getByText(/maybe later/i);
      expect(maybeLaterButton).toBeOnTheScreen();

      mockRequestPermission.mockResolvedValue(AuthorizationStatus.DENIED);
      mockHasPermission.mockResolvedValue(AuthorizationStatus.DENIED);
      await user.press(maybeLaterButton);
      await waitFor(() => expect(maybeLaterButton).not.toBeOnTheScreen());

      advanceTime(REPROMPT_SCHEDULE[0]);
      await tryTriggerDrawer();
      const maybeLaterButton1 = screen.getByText(/maybe later/i);
      expect(maybeLaterButton1).toBeOnTheScreen();
      await user.press(maybeLaterButton1);
      await waitFor(() => expect(maybeLaterButton1).not.toBeOnTheScreen());

      advanceTime(REPROMPT_SCHEDULE[1]);
      await tryTriggerDrawer();
      const maybeLaterButton2 = screen.getByText(/maybe later/i);
      expect(maybeLaterButton2).toBeOnTheScreen();
      await user.press(screen.getByText(/maybe later/i));
      await waitFor(() => expect(maybeLaterButton2).not.toBeOnTheScreen());

      advanceTime(REPROMPT_SCHEDULE[2]);
      await tryTriggerDrawer();
      const maybeLaterButton3 = screen.getByText(/maybe later/i);
      expect(maybeLaterButton3).toBeOnTheScreen();
      await user.press(maybeLaterButton3);
      await waitFor(() => expect(maybeLaterButton3).not.toBeOnTheScreen());

      // It should reprompt using the maximum delay, since we've already dismissed the drawer as many times as the length of reprompt_schedule allows.
      advanceTime(REPROMPT_SCHEDULE[0]);
      await tryTriggerDrawer();
      expect(screen.queryByText(/maybe later/i)).not.toBeOnTheScreen();
      advanceTime(REPROMPT_SCHEDULE[2]);
      await tryTriggerDrawer();
      expect(screen.getByText(/maybe later/i)).toBeOnTheScreen();
    });

    it("should reprompt after each delay when user opts out notifications by clicking on backdrop", async () => {
      const { tryTriggerDrawer, user } = await setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: false,
      });

      await tryTriggerDrawer();
      const backdrop = screen.getByTestId("drawer-backdrop");
      await user.press(backdrop);
      await waitFor(() => expect(backdrop).not.toBeOnTheScreen());

      advanceTime(REPROMPT_SCHEDULE[0]);
      await tryTriggerDrawer();
      const backdrop1 = screen.getByTestId("drawer-backdrop");
      expect(backdrop1).toBeOnTheScreen();
      await user.press(backdrop1);
      await waitFor(() => expect(backdrop1).not.toBeOnTheScreen());

      advanceTime(REPROMPT_SCHEDULE[1]);
      await tryTriggerDrawer();
      const backdrop2 = screen.getByTestId("drawer-backdrop");
      expect(backdrop2).toBeOnTheScreen();
      await user.press(backdrop2);
      await waitFor(() => expect(backdrop2).not.toBeOnTheScreen());

      advanceTime(REPROMPT_SCHEDULE[2]);
      await tryTriggerDrawer();
      const backdrop3 = screen.getByTestId("drawer-backdrop");
      expect(backdrop3).toBeOnTheScreen();
      await user.press(backdrop3);
      await waitFor(() => expect(backdrop3).not.toBeOnTheScreen());
    });

    it("should not reprompt when delay is not reached", async () => {
      const { tryTriggerDrawer, user } = await setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: false,
      });

      await tryTriggerDrawer();
      const maybeLaterButton = screen.getByText(/maybe later/i);
      await user.press(maybeLaterButton);
      await waitFor(() => expect(maybeLaterButton).not.toBeOnTheScreen());

      advanceTime({ days: 10 });
      await tryTriggerDrawer();
      expect(screen.queryByText(/maybe later/i)).not.toBeOnTheScreen();
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

      advanceTime({ days: 15 });
      await tryTriggerDrawer();
      expect(screen.queryByText(/maybe later/i)).not.toBeOnTheScreen();
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

      advanceTime(REPROMPT_SCHEDULE[0]);
      await tryTriggerDrawer();
      await waitFor(() => expect(screen.getByText(/maybe later/i)).toBeOnTheScreen());
      expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
      await user.press(screen.getByTestId("drawer-backdrop"));
      await waitFor(() => expect(screen.queryByTestId("drawer-backdrop")).not.toBeOnTheScreen());

      advanceTime({ days: 30 });
      await tryTriggerDrawer();
      expect(screen.queryByText(/maybe later/i)).not.toBeOnTheScreen();
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

      advanceTime({ days: 45 });
      await tryTriggerDrawer();
      expect(screen.queryByText(/maybe later/i)).not.toBeOnTheScreen();
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

      advanceTime(REPROMPT_SCHEDULE[1]);
      await tryTriggerDrawer();
      await waitFor(() => expect(screen.getByText(/maybe later/i)).toBeOnTheScreen());
      expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
    });
  });
});
