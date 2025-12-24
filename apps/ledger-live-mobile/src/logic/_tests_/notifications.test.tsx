import * as React from "react";
import { Button, View } from "react-native";
import { act, render, screen, userEvent } from "@tests/test-renderer";
import { setPushNotificationsDataOfUserInStorage, useNotifications } from "../notifications";
import storage from "LLM/storage";
import { add, sub, type Duration } from "date-fns";
import type { NotificationsState } from "~/reducers/types";
import PushNotificationsModal from "~/screens/PushNotificationsModal";

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

const REPROMPT_SCHEDULE = [{ months: 1 }, { months: 3 }, { months: 6 }];

jest.mock("@ledgerhq/live-common/featureFlags/useFeature", () => {
  return jest.fn(name => {
    if (name === "brazePushNotifications") {
      return {
        enabled: true,
        params: {
          action_events: {
            complete_onboarding: {
              enabled: true,
              timer: 2000,
            },

            add_favorite_coin: {
              enabled: true,
              timer: 1000,
            },

            send: {
              enabled: true,
              timer: 2000,
            },
            receive: {
              enabled: true,
              timer: 2000,
            },
            buy: {
              enabled: true,
              timer: 2000,
            },
            swap: {
              enabled: true,
              timer: 2000,
            },
            stake: {
              enabled: true,
              timer: 2000,
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

    console.error(`Unhandled feature flag: ${name}`);

    return {
      enabled: true,
    };
  });
});

type NotificationTestComponentProps = {
  readonly actionSource?: Exclude<NotificationsState["drawerSource"], "generic">;
};

const btnTestIds = {
  triggerNotification: "trigger-notification-button",
  allowNotifications: "notifications-prompt-allow",
  delayLater: "notifications-prompt-later",
  closeBackdrop: "drawer-backdrop",
};

function NotificationTestComponent({ actionSource = "buy" }: NotificationTestComponentProps) {
  const { tryTriggerPushNotificationDrawerAfterAction } = useNotifications();

  return (
    <View>
      <PushNotificationsModal />
      <Button
        testID={btnTestIds.triggerNotification}
        title="Trigger Notification"
        onPress={() => tryTriggerPushNotificationDrawerAfterAction(actionSource)}
      />
    </View>
  );
}

describe("Push Notification Drawer", () => {
  beforeEach(() => {
    storage.deleteAll();

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const setup = ({
    osPermission,
    appNotifications,
    actionSource = "buy",
  }: {
    osPermission: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];
    appNotifications: boolean;
    actionSource?: Exclude<NotificationsState["drawerSource"], "generic">;
  }) => {
    mockHasPermission.mockResolvedValue(osPermission);

    const rendered = render(<NotificationTestComponent actionSource={actionSource} />, {
      overrideInitialState: state => {
        state.settings.notifications.areNotificationsAllowed = appNotifications;
        return state;
      },
    });

    return rendered;
  };

  const advanceTime = (duration: Duration) => {
    jest.setSystemTime(add(Date.now(), duration));
  };

  const triggerNotificationsDrawer = async () => {
    await userEvent.press(screen.getByTestId(btnTestIds.triggerNotification));
    act(() => jest.runAllTimers());
  };

  describe("OS === undetermined", () => {
    it("app === false => should show notification drawer", async () => {
      setup({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: false,
      });

      await triggerNotificationsDrawer();

      expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();
    });

    it("app === true => should show notification drawer", async () => {
      setup({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: true,
      });

      await triggerNotificationsDrawer();

      expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();
    });
  });

  describe("OS === authorized", () => {
    it("app === false => should show notification drawer", async () => {
      setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: false,
      });

      await triggerNotificationsDrawer();

      expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();
    });

    it("app === true => should not show notification drawer", async () => {
      setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: true,
      });

      await triggerNotificationsDrawer();

      expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();
    });
  });

  describe("OS === denied", () => {
    it("app === false => should not show drawer immediately, then show after delay", async () => {
      setup({
        osPermission: AuthorizationStatus.DENIED,
        appNotifications: false,
      });

      await triggerNotificationsDrawer();
      expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();

      advanceTime(REPROMPT_SCHEDULE[0]);
      await triggerNotificationsDrawer();
      expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();
    });

    it("app === true => should not show drawer immediately, then show after delay", async () => {
      setup({
        osPermission: AuthorizationStatus.DENIED,
        appNotifications: true,
      });

      await triggerNotificationsDrawer();
      expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();

      advanceTime(REPROMPT_SCHEDULE[0]);
      await triggerNotificationsDrawer();
      expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();
    });
  });

  describe("reprompt", () => {
    it("should show drawer at the next reprompt delay after dismissals", async () => {
      const { store } = setup({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: true,
      });

      // Initial trigger shows drawer
      await triggerNotificationsDrawer();
      expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();

      // 1st dismissal -> should reprompt after 1 month
      await userEvent.press(screen.getByTestId(btnTestIds.closeBackdrop));
      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toHaveLength(1);
      expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();

      // should not show drawer immediately
      await triggerNotificationsDrawer();
      expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();

      // shows drawer after reprompt delay
      advanceTime(REPROMPT_SCHEDULE[0]);
      await triggerNotificationsDrawer();
      expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();
      expect(screen.getByTestId(btnTestIds.delayLater)).toBeOnTheScreen();
      expect(screen.getByTestId(btnTestIds.allowNotifications)).toBeOnTheScreen();

      // 2nd dismissal -> should reprompt after 3 months
      // delay later button should behave the same as pressing the backdrop
      await userEvent.press(screen.getByTestId(btnTestIds.delayLater));
      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toHaveLength(2);
      expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();

      // should not show drawer immediately
      await triggerNotificationsDrawer();
      expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();

      // shows drawer after 2nd reprompt delay
      advanceTime(REPROMPT_SCHEDULE[1]);
      await triggerNotificationsDrawer();
      expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();
      expect(screen.getByTestId(btnTestIds.delayLater)).toBeOnTheScreen();
      expect(screen.getByTestId(btnTestIds.allowNotifications)).toBeOnTheScreen();

      // // 3rd dismissal -> should reprompt after 6 months
      await userEvent.press(screen.getByTestId(btnTestIds.delayLater));
      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toHaveLength(3);
      expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();

      // shows drawer after 3rd reprompt delay
      advanceTime(REPROMPT_SCHEDULE[2]);
      await triggerNotificationsDrawer();
      expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();
      expect(screen.getByTestId(btnTestIds.delayLater)).toBeOnTheScreen();
      expect(screen.getByTestId(btnTestIds.allowNotifications)).toBeOnTheScreen();
    });

    it("should stop showing drawer when user opts in", async () => {
      const { store } = setup({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: true,
      });

      await triggerNotificationsDrawer();
      expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();

      // Dismiss once
      await userEvent.press(screen.getByTestId(btnTestIds.closeBackdrop));
      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toHaveLength(1);

      advanceTime(REPROMPT_SCHEDULE[0]);
      await triggerNotificationsDrawer();
      expect(screen.getByTestId(btnTestIds.delayLater)).toBeOnTheScreen();

      // User opts in
      mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
      await userEvent.press(screen.getByTestId(btnTestIds.allowNotifications));

      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toBeUndefined();
      expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();

      // Should not show again even after long time
      advanceTime({ months: 12 });
      await triggerNotificationsDrawer();
      expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();
    });
  });

  describe("backwards compatibility", () => {
    describe("already opted in notifications", () => {
      it("alreadyDelayedToLater: should not show drawer", async () => {
        await setPushNotificationsDataOfUserInStorage({
          alreadyDelayedToLater: true,
        });

        setup({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: true,
        });

        await triggerNotificationsDrawer();
        expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();

        advanceTime(REPROMPT_SCHEDULE[0]);
        await triggerNotificationsDrawer();

        expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();
      });

      it("dateOfNextAllowedRequest: should not show drawer", async () => {
        await setPushNotificationsDataOfUserInStorage({
          dateOfNextAllowedRequest: sub(new Date(), { months: 1 }),
        });

        setup({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: true,
        });

        await triggerNotificationsDrawer();
        expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();

        advanceTime(REPROMPT_SCHEDULE[0]);
        await triggerNotificationsDrawer();
        expect(screen.queryByTestId(btnTestIds.closeBackdrop)).not.toBeOnTheScreen();
      });
    });

    describe("already opted out notifications", () => {
      const LONG_TIME_AGO = sub(new Date(), { years: 1 });

      describe("OS === denied", () => {
        it("app === true => should show drawer after reprompt delay", async () => {
          await setPushNotificationsDataOfUserInStorage({
            dateOfNextAllowedRequest: LONG_TIME_AGO,
          });

          setup({
            osPermission: AuthorizationStatus.DENIED,
            appNotifications: true,
          });

          await triggerNotificationsDrawer();
          expect(screen.queryByTestId(btnTestIds.allowNotifications)).not.toBeOnTheScreen();

          advanceTime({ days: 8 });
          await triggerNotificationsDrawer();
          expect(screen.queryByTestId(btnTestIds.allowNotifications)).not.toBeOnTheScreen();

          advanceTime(REPROMPT_SCHEDULE[0]);
          await triggerNotificationsDrawer();

          expect(screen.getByTestId(btnTestIds.allowNotifications)).toBeOnTheScreen();
          expect(screen.getByTestId(btnTestIds.delayLater)).toBeOnTheScreen();
          expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();
        });

        it("app === false => should show drawer after reprompt delay", async () => {
          await setPushNotificationsDataOfUserInStorage({
            dateOfNextAllowedRequest: LONG_TIME_AGO,
          });

          setup({
            osPermission: AuthorizationStatus.DENIED,
            appNotifications: false,
          });

          await triggerNotificationsDrawer();
          expect(screen.queryByTestId(btnTestIds.allowNotifications)).not.toBeOnTheScreen();

          advanceTime({ days: 15 });
          await triggerNotificationsDrawer();
          expect(screen.queryByTestId(btnTestIds.allowNotifications)).not.toBeOnTheScreen();

          advanceTime(REPROMPT_SCHEDULE[0]);

          await triggerNotificationsDrawer();

          expect(screen.getByTestId(btnTestIds.allowNotifications)).toBeOnTheScreen();
          expect(screen.getByTestId(btnTestIds.delayLater)).toBeOnTheScreen();
          expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();
        });
      });

      describe("OS === authorized", () => {
        it("app === false => should show drawer immediately after initial period", async () => {
          await setPushNotificationsDataOfUserInStorage({
            dateOfNextAllowedRequest: LONG_TIME_AGO,
          });

          setup({
            osPermission: AuthorizationStatus.AUTHORIZED,
            appNotifications: false,
          });

          advanceTime({ weeks: 3 });

          await triggerNotificationsDrawer();
          expect(screen.queryByTestId(btnTestIds.allowNotifications)).not.toBeOnTheScreen();

          advanceTime(REPROMPT_SCHEDULE[0]);

          await triggerNotificationsDrawer();
          expect(screen.getByTestId(btnTestIds.allowNotifications)).toBeOnTheScreen();
          expect(screen.getByTestId(btnTestIds.delayLater)).toBeOnTheScreen();
          expect(screen.getByTestId(btnTestIds.closeBackdrop)).toBeOnTheScreen();
        });
      });
    });
  });
});
