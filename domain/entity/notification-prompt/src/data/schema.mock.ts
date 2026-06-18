import type {
  NotificationPermissionStatus,
  NotificationPromptHistory,
  NotificationPromptPolicy,
} from "./schema";

export const mockNotificationPermissionStatus = (
  status: NotificationPermissionStatus = "denied",
): NotificationPermissionStatus => status;

export const mockNotificationPromptHistory = (
  overrides?: Partial<NotificationPromptHistory>,
): NotificationPromptHistory => ({
  dismissedOptInDrawerAtList: [],
  dismissedPromptAtListByTarget: {},
  ...overrides,
});

export const mockNotificationPromptPolicy = (
  overrides?: Partial<NotificationPromptPolicy>,
): NotificationPromptPolicy => ({
  enabled: true,
  variant: "B",
  actionEvents: {
    complete_onboarding: { enabled: true, timer: 0 },
    add_favorite_coin: { enabled: true, timer: 0 },
    send: { enabled: true, timer: 0 },
    dapp_complete: { enabled: true, timer: 0 },
    receive: { enabled: true, timer: 0 },
    swap: { enabled: true, timer: 0 },
    stake: { enabled: true, timer: 0 },
  },
  repromptSchedule: [{ days: 7 }],
  inactivityEnabled: true,
  inactivityReprompt: { months: 6 },
  notificationsCategories: [
    {
      category: "transactionsAlertsCategory",
      drawerPromptEnabled: true,
      drawerPromptActions: ["send", "receive"],
    },
  ],
  ...overrides,
});
