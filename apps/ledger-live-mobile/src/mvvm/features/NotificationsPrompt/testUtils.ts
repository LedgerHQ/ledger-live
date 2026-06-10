import type { Features } from "@shared/feature-flags";
import { AB_TESTING_VARIANTS } from "./types/variants";

type BrazePushNotificationsParams = NonNullable<Features["brazePushNotifications"]["params"]>;
type BrazeNotificationsCategoryConfig = BrazePushNotificationsParams["notificationsCategories"][number];
type WordingFeatureParams = NonNullable<
  Features["lwmNewWordingOptInNotificationsDrawer"]["params"]
>;

export const transactionsAlertsDrawerPromptCategoryConfig: BrazeNotificationsCategoryConfig = {
  displayed: true,
  category: "transactionsAlertsCategory",
  drawerPromptEnabled: true,
  drawerPromptActions: ["send", "receive"],
};

const defaultRepromptSchedule: BrazePushNotificationsParams["reprompt_schedule"] = [
  { months: 0, days: 7, hours: 0, minutes: 0, seconds: 0 },
];

const defaultInactivityReprompt: BrazePushNotificationsParams["inactivity_reprompt"] = {
  months: 6,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

export const notificationsPromptActionEvents: BrazePushNotificationsParams["action_events"] = {
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
  dapp_complete: {
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
};

export function createNotificationsPromptFeatureFlags({
  variant = AB_TESTING_VARIANTS.B,
  repromptSchedule = defaultRepromptSchedule,
  inactivityEnabled = false,
  inactivityReprompt = defaultInactivityReprompt,
  notificationsCategories = [],
}: {
  variant?: WordingFeatureParams["variant"];
  repromptSchedule?: BrazePushNotificationsParams["reprompt_schedule"];
  inactivityEnabled?: BrazePushNotificationsParams["inactivity_enabled"];
  inactivityReprompt?: BrazePushNotificationsParams["inactivity_reprompt"];
  notificationsCategories?: BrazePushNotificationsParams["notificationsCategories"];
} = {}) {
  return {
    brazePushNotifications: {
      enabled: true,
      params: {
        action_events: notificationsPromptActionEvents,
        reprompt_schedule: repromptSchedule,
        inactivity_enabled: inactivityEnabled,
        inactivity_reprompt: inactivityReprompt,
        notificationsCategories,
      },
    },
    lwmNewWordingOptInNotificationsDrawer: {
      enabled: true,
      params: {
        variant,
      },
    },
  };
}
