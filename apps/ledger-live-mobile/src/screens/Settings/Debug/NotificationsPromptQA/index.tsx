import React, { useCallback, useMemo, useState } from "react";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useFeature } from "@features/platform-feature-flags";
import {
  type NotificationsPromptAfterActionSource,
  useNotificationsContext,
  useNotificationsData,
} from "LLM/features/NotificationsPrompt";
import { useNotificationsPromptDrawerScheduler } from "LLM/features/NotificationsPrompt/new/hooks/useNotificationsPromptDrawerScheduler";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import { TrackScreen } from "~/analytics";
import { useSelector } from "~/context/hooks";
import { hasCompletedOnboardingSelector, notificationsSelector } from "~/reducers/settings";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import {
  buildInactiveUserData,
  buildRepromptableUserData,
  buildTruncatedDismissalsUserData,
  formatDismissalTimestamp,
  getAfterActionRepromptLabel,
  getGlobalPushNotificationsDismissals,
  getInactivityRepromptLabel,
} from "./utils";

const TRIGGER_SOURCES: NotificationsPromptAfterActionSource[] = [
  "onboarding",
  "add_favorite_coin",
  "send",
  "receive",
  "swap",
  "stake",
];

function valueLxColor(ok: boolean): "success" | "error" {
  return ok ? "success" : "error";
}

export default function DebugNotificationsPromptQA() {
  const [selectedSource, setSelectedSource] =
    useState<NotificationsPromptAfterActionSource>("onboarding");
  const [featureFlagsExpanded, setFeatureFlagsExpanded] = useState(false);

  const brazePushNotifications = useFeature("brazePushNotifications");
  const notifications = useSelector(notificationsSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const { permissionStatus } = useNotificationsPermission();
  const { pushNotificationsDataOfUser, updatePushNotificationsDataOfUserInStateAndStore } =
    useNotificationsData();
  const { notifyFlowCompleted } = useNotificationsContext();
  const { openDrawer } = useNotificationsPromptDrawerScheduler();

  const globalPushNotificationsDismissals = useMemo(
    () => getGlobalPushNotificationsDismissals(pushNotificationsDataOfUser),
    [pushNotificationsDataOfUser],
  );
  const dismissedCount = globalPushNotificationsDismissals?.length ?? 0;
  const isOsNotificationsEnabled = permissionStatus === AuthorizationStatus.AUTHORIZED;
  const isAppNotificationsEnabled = notifications.areNotificationsAllowed === true;
  const isOptIn = isOsNotificationsEnabled && isAppNotificationsEnabled;
  const optState = isOptIn ? "isOptIn" : "isOptOut";

  const now = Date.now();
  const afterActionRepromptLabel = getAfterActionRepromptLabel({
    dismissedOptInDrawerAtList: globalPushNotificationsDismissals,
    repromptSchedule: brazePushNotifications?.params?.reprompt_schedule,
    now,
  });
  const inactivityRepromptLabel = getInactivityRepromptLabel({
    lastActionAt: pushNotificationsDataOfUser?.lastActionAt,
    inactivityReprompt: brazePushNotifications?.params?.inactivity_reprompt,
    inactivityEnabled: brazePushNotifications?.params?.inactivity_enabled,
    now,
  });

  const onMarkInactive = useCallback(() => {
    updatePushNotificationsDataOfUserInStateAndStore(
      buildInactiveUserData(
        pushNotificationsDataOfUser,
        brazePushNotifications?.params?.inactivity_reprompt,
        Date.now(),
      ),
    );
  }, [
    brazePushNotifications?.params?.inactivity_reprompt,
    pushNotificationsDataOfUser,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);

  const onMarkRepromptable = useCallback(() => {
    updatePushNotificationsDataOfUserInStateAndStore(
      buildRepromptableUserData(
        pushNotificationsDataOfUser,
        brazePushNotifications?.params?.reprompt_schedule,
        Date.now(),
      ),
    );
  }, [
    brazePushNotifications?.params?.reprompt_schedule,
    pushNotificationsDataOfUser,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);

  const onGoBackToSecondDismissal = useCallback(() => {
    updatePushNotificationsDataOfUserInStateAndStore(
      buildTruncatedDismissalsUserData(pushNotificationsDataOfUser, 2),
    );
  }, [pushNotificationsDataOfUser, updatePushNotificationsDataOfUserInStateAndStore]);

  const onTriggerDrawer = useCallback(() => {
    notifyFlowCompleted(selectedSource);
  }, [notifyFlowCompleted, selectedSource]);

  const onForceOpenDrawer = useCallback(() => {
    openDrawer(selectedSource, 0, "globalPushNotifications");
  }, [openDrawer, selectedSource]);

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="DebugNotificationsPromptQA" />
      <Box lx={{ paddingHorizontal: "s24", paddingBottom: "s24" }}>
        <Text typography="body2SemiBold" lx={{ color: "muted", marginBottom: "s12" }}>
          NOTIFICATIONS PROMPT — QA
        </Text>

        <SectionTitle>1. Opt state</SectionTitle>
        <InfoRow label="State" value={optState} valueColor={isOptIn ? "success" : "error"} />

        <SectionTitle>2. Notification enablement status</SectionTitle>
        <InfoRow
          label="App notifications enabled"
          value={String(isAppNotificationsEnabled)}
          valueColor={valueLxColor(isAppNotificationsEnabled)}
        />
        <InfoRow
          label="OS notifications enabled"
          value={String(isOsNotificationsEnabled)}
          valueColor={valueLxColor(isOsNotificationsEnabled)}
        />
        <InfoRow label="OS permission status" value={String(permissionStatus ?? "undefined")} />
        <InfoRow
          label="Onboarding complete"
          value={String(hasCompletedOnboarding)}
          valueColor={valueLxColor(hasCompletedOnboarding)}
        />

        <SectionTitle>3. Reprompt timing</SectionTitle>
        <InfoRow label="After action" value={afterActionRepromptLabel} />
        <InfoRow label="After inactivity" value={inactivityRepromptLabel} />

        <SectionTitle>4. Dismissal data</SectionTitle>
        <InfoRow label="dismissedCount" value={String(dismissedCount)} />
        {!globalPushNotificationsDismissals?.length ? (
          <Text typography="body3" lx={{ color: "muted", marginBottom: "s12" }}>
            globalPushNotifications dismissals are empty
          </Text>
        ) : (
          globalPushNotificationsDismissals.map((timestamp, index) => {
            const formatted = formatDismissalTimestamp(timestamp);
            return (
              <Box key={`${timestamp}-${index}`} lx={{ marginBottom: "s12" }}>
                <Text typography="body3SemiBold" lx={{ color: "base", marginBottom: "s4" }}>
                  #{index + 1}
                </Text>
                <Text typography="body3" lx={{ color: "muted" }} selectable>
                  epoch ms: {formatted.epochMs}
                </Text>
                <Text typography="body3" lx={{ color: "muted" }} selectable>
                  ISO: {formatted.iso}
                </Text>
                <Text typography="body3" lx={{ color: "muted" }} selectable>
                  local: {formatted.local}
                </Text>
              </Box>
            );
          })
        )}

        <SectionTitle>5. Feature flags</SectionTitle>
        <Button
          size="sm"
          appearance="base"
          onPress={() => setFeatureFlagsExpanded(expanded => !expanded)}
          lx={{ marginBottom: "s12", alignSelf: "flex-start" }}
        >
          {featureFlagsExpanded ? "Hide feature flag details" : "Show feature flag details"}
        </Button>
        {featureFlagsExpanded ? (
          <Box lx={{ marginBottom: "s16" }}>
            <Text typography="body3" lx={{ color: "muted", marginBottom: "s8" }} selectable>
              brazePushNotifications.enabled: {String(brazePushNotifications?.enabled ?? false)}
            </Text>
            <Text typography="body3" lx={{ color: "muted", marginBottom: "s8" }} selectable>
              reprompt_schedule:{" "}
              {JSON.stringify(brazePushNotifications?.params?.reprompt_schedule ?? null)}
            </Text>
            <Text typography="body3" lx={{ color: "muted", marginBottom: "s8" }} selectable>
              action_events: {JSON.stringify(brazePushNotifications?.params?.action_events ?? null)}
            </Text>
            <Text typography="body3" lx={{ color: "muted", marginBottom: "s8" }} selectable>
              inactivity_enabled:{" "}
              {String(brazePushNotifications?.params?.inactivity_enabled ?? false)}
            </Text>
            <Text typography="body3" lx={{ color: "muted" }} selectable>
              inactivity_reprompt:{" "}
              {JSON.stringify(brazePushNotifications?.params?.inactivity_reprompt ?? null)}
            </Text>
          </Box>
        ) : null}

        <SectionTitle>Actions</SectionTitle>
        <Box lx={{ gap: "s8", marginBottom: "s16" }}>
          <Button appearance="accent" size="sm" onPress={onMarkInactive}>
            Mark as inactive
          </Button>
          <Button appearance="accent" size="sm" onPress={onMarkRepromptable}>
            Mark user as can be reprompted
          </Button>
          <Button appearance="accent" size="sm" onPress={onGoBackToSecondDismissal}>
            Go back in time (keep 2 dismissals)
          </Button>
        </Box>

        <Text typography="body3SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
          Trigger drawer source
        </Text>
        <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8", marginBottom: "s12" }}>
          {TRIGGER_SOURCES.map(source => (
            <Button
              key={source}
              size="sm"
              appearance={selectedSource === source ? "accent" : "base"}
              onPress={() => setSelectedSource(source)}
            >
              {source}
            </Button>
          ))}
        </Box>
        <Box lx={{ gap: "s8", marginBottom: "s16" }}>
          <Button appearance="accent" onPress={onTriggerDrawer}>
            Trigger drawer (production rules)
          </Button>
          <Button appearance="base" onPress={onForceOpenDrawer}>
            Force open drawer
          </Button>
        </Box>

        <Text typography="body3" lx={{ color: "muted" }}>
          Leave this screen to see the drawer. Production rules may skip the drawer if eligibility
          checks fail — use force open to bypass them.
        </Text>
      </Box>
    </SettingsNavigationScrollView>
  );
}

function SectionTitle({ children }: Readonly<{ children: string }>) {
  return (
    <Text
      typography="heading5SemiBold"
      lx={{ color: "base", marginTop: "s16", marginBottom: "s8" }}
    >
      {children}
    </Text>
  );
}

function InfoRow({
  label,
  value,
  valueColor = "base",
}: Readonly<{
  label: string;
  value: string;
  valueColor?: "base" | "success" | "error" | "muted";
}>) {
  return (
    <Box lx={{ marginBottom: "s8" }}>
      <Text typography="body3" lx={{ color: "muted" }}>
        {label}
      </Text>
      <Text typography="body2SemiBold" lx={{ color: valueColor }} selectable>
        {value}
      </Text>
    </Box>
  );
}
