import {
  NotificationPromptPolicySchema,
  type NotificationPromptActionEventKey,
  type NotificationPromptPolicy,
  type NotificationPromptTarget,
} from "@domain/entity-notification-prompt";
import type { Features } from "@shared/feature-flags";

export type NotificationPromptFeatureFlags = {
  brazePushNotifications: Features["brazePushNotifications"] | null | undefined;
  lwmNewWordingOptInNotificationsDrawer:
    | Features["lwmNewWordingOptInNotificationsDrawer"]
    | null
    | undefined;
};

type BrazePushNotificationsFeature = NonNullable<
  NotificationPromptFeatureFlags["brazePushNotifications"]
>;
type BrazePushNotificationsParams = NonNullable<BrazePushNotificationsFeature["params"]>;
type BrazeNotificationsCategoryConfig = BrazePushNotificationsParams["notificationsCategories"][number];

const DOMAIN_ACTION_EVENT_KEYS = [
  "complete_onboarding",
  "send",
  "dapp_complete",
  "receive",
  "swap",
  "stake",
  "add_favorite_coin",
] as const satisfies NotificationPromptActionEventKey[];

const DOMAIN_PROMPT_TARGETS = new Set<NotificationPromptTarget>([
  "globalPushNotifications",
  "transactionsAlertsCategory",
]);

const mapActionEvents = (actionEvents: BrazePushNotificationsParams["action_events"] | undefined) =>
  Object.fromEntries(
    DOMAIN_ACTION_EVENT_KEYS.flatMap(key => {
      const actionEvent = actionEvents?.[key];
      return actionEvent ? [[key, actionEvent]] : [];
    }),
  );

const mapNotificationsCategories = (
  notificationsCategories: BrazePushNotificationsParams["notificationsCategories"] | undefined,
) =>
  notificationsCategories
    ?.filter(
      (
        category,
      ): category is BrazeNotificationsCategoryConfig & { category: NotificationPromptTarget } =>
        DOMAIN_PROMPT_TARGETS.has(category.category as NotificationPromptTarget),
    )
    .map(({ category, drawerPromptEnabled, drawerPromptActions }) => ({
      category,
      drawerPromptEnabled: drawerPromptEnabled === true,
      drawerPromptActions,
    }));

export const mapFeatureFlagsToNotificationPromptPolicy = ({
  brazePushNotifications,
  lwmNewWordingOptInNotificationsDrawer,
}: NotificationPromptFeatureFlags): NotificationPromptPolicy =>
  NotificationPromptPolicySchema.parse({
    enabled: brazePushNotifications?.enabled === true,
    variant: lwmNewWordingOptInNotificationsDrawer?.enabled
      ? lwmNewWordingOptInNotificationsDrawer.params?.variant
      : undefined,
    actionEvents: brazePushNotifications?.params?.action_events
      ? mapActionEvents(brazePushNotifications.params.action_events)
      : undefined,
    repromptSchedule: brazePushNotifications?.params?.reprompt_schedule,
    inactivityEnabled: brazePushNotifications?.params?.inactivity_enabled,
    inactivityReprompt: brazePushNotifications?.params?.inactivity_reprompt,
    notificationsCategories: mapNotificationsCategories(
      brazePushNotifications?.params?.notificationsCategories,
    ),
  });
