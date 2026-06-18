import {
  mapFeatureFlagsToNotificationPromptPolicy,
  type NotificationPromptFeatureFlags,
} from "./mapFeatureFlagsToNotificationPromptPolicy";

const duration = { months: 0, days: 7, hours: 0, minutes: 0, seconds: 0 };
const inactivityDuration = { months: 6, days: 0, hours: 0, minutes: 0, seconds: 0 };
const enabledActionEvent = { enabled: true, timer: 0 };

const featureFlags: NotificationPromptFeatureFlags = {
  brazePushNotifications: {
    enabled: true,
    params: {
      action_events: {
        send: { enabled: true, timer: 100 },
        buy: { enabled: true, timer: 200 },
        complete_onboarding: enabledActionEvent,
        dapp_complete: enabledActionEvent,
        receive: enabledActionEvent,
        swap: enabledActionEvent,
        stake: enabledActionEvent,
        add_favorite_coin: enabledActionEvent,
      },
      reprompt_schedule: [duration],
      inactivity_enabled: true,
      inactivity_reprompt: inactivityDuration,
      notificationsCategories: [
        {
          displayed: true,
          category: "transactionsAlertsCategory",
          drawerPromptEnabled: true,
          drawerPromptActions: ["send", "receive"],
        },
        {
          displayed: true,
          category: "announcementsCategory",
          drawerPromptEnabled: true,
          drawerPromptActions: ["send"],
        },
      ],
    },
  },
  lwmNewWordingOptInNotificationsDrawer: {
    enabled: true,
    params: {
      variant: "B",
    },
  },
};

describe("mapFeatureFlagsToNotificationPromptPolicy", () => {
  it("maps notification feature flags to a normalized domain policy", () => {
    expect(mapFeatureFlagsToNotificationPromptPolicy(featureFlags)).toEqual({
      enabled: true,
      variant: "B",
      actionEvents: {
        complete_onboarding: enabledActionEvent,
        send: { enabled: true, timer: 100 },
        dapp_complete: enabledActionEvent,
        receive: enabledActionEvent,
        swap: enabledActionEvent,
        stake: enabledActionEvent,
        add_favorite_coin: enabledActionEvent,
      },
      repromptSchedule: [duration],
      inactivityEnabled: true,
      inactivityReprompt: inactivityDuration,
      notificationsCategories: [
        {
          category: "transactionsAlertsCategory",
          drawerPromptEnabled: true,
          drawerPromptActions: ["send", "receive"],
        },
      ],
    });
  });

  it("disables the policy when the Braze notification flag is disabled", () => {
    expect(
      mapFeatureFlagsToNotificationPromptPolicy({
        ...featureFlags,
        brazePushNotifications: {
          ...featureFlags.brazePushNotifications,
          enabled: false,
        },
      }).enabled,
    ).toBe(false);
  });
});
