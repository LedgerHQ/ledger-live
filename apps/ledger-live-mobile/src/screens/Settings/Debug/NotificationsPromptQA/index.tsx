import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, TouchableOpacity } from "react-native";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import {
  Box,
  Button,
  Divider,
  SegmentedControl,
  SegmentedControlButton,
  Tag,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import {
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
  getNotificationPromptTarget,
  type AfterActionTriggerDecision,
  type InactivityTriggerDecision,
  type NotificationPromptTarget,
  useNotificationsPrompt,
  useNotificationsData,
} from "LLM/features/NotificationsPrompt";
import { NotificationsPromptDrawerView } from "LLM/features/NotificationsPrompt/screens/NotificationsPromptDrawerView";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import QueuedDrawer from "~/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  setNotificationsDrawerPromptTarget,
  setNotificationsDrawerSource,
  setNotificationsModalOpen,
} from "~/actions/notifications";
import { completeOnboarding, setNotifications } from "~/actions/settings";
import { ratingsModalOpenSelector } from "~/reducers/ratings";
import { hasCompletedOnboardingSelector, notificationsSelector } from "~/reducers/settings";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import {
  buildInactiveUserData,
  buildNotificationsQaScenarioUserData,
  buildRepromptableUserData,
  buildTruncatedDismissalsUserData,
  formatDismissalTimestamp,
  formatPermissionStatus,
  getAfterActionRepromptLabel,
  getGlobalPushNotificationsDismissals,
  getInactivityRepromptLabel,
  mapNotificationsDecisionToQaExpectation,
  NOTIFICATIONS_PROMPT_REASON_LABEL,
  NOTIFICATIONS_QA_GROUPS,
  NOTIFICATIONS_QA_SCENARIOS,
  NOTIFICATIONS_QA_VERDICT_META,
  type NotificationsQaScenario,
  type NotificationsQaTriggerSource,
} from "./utils";

const TRIGGER_SOURCES: NotificationsQaTriggerSource[] = [
  "onboarding",
  "send",
  "receive",
  "swap",
  "stake",
  "add_favorite_coin",
  "inactivity",
];

const SOURCE_LABEL: Record<NotificationsQaTriggerSource, string> = {
  onboarding: "Onboarding",
  send: "Send",
  receive: "Receive",
  swap: "Swap",
  stake: "Stake",
  add_favorite_coin: "Add favourite coin",
  dapp_complete: "DApp complete",
  inactivity: "Inactivity",
};

type TabId = "scenarios" | "inspect";
type FieldTone = "success" | "error" | "warning" | "gray";

type InspectorField = {
  label: string;
  value: string;
  raw?: string;
  status: { label: string; tone: FieldTone };
};

function confirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}

function formatDelay(delay: Record<string, number> | null | undefined): string {
  if (!delay) return "Not configured";

  const parts = Object.entries(delay)
    .filter(([, value]) => value > 0)
    .map(([unit, value]) => `${value} ${unit}`);
  return parts.length > 0 ? parts.join(", ") : "Immediately";
}

function InspectorRow({ field }: Readonly<{ field: InspectorField }>) {
  return (
    <Box
      lx={{
        paddingHorizontal: "s8",
        paddingVertical: "s12",
        borderRadius: "sm",
        marginBottom: "s8",
        gap: "s8",
        borderWidth: "s1",
        borderColor: "muted",
      }}
    >
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "s8",
        }}
      >
        <Text typography="body2SemiBold" lx={{ color: "base", flex: 1 }}>
          {field.label}
        </Text>
        <Tag label={field.status.label} size="sm" appearance={field.status.tone} />
      </Box>
      <Text typography="body2SemiBold" lx={{ color: "base" }} selectable>
        {field.value}
      </Text>
      {field.raw ? (
        <Text typography="body3" lx={{ color: "muted" }} selectable>
          {field.raw}
        </Text>
      ) : null}
    </Box>
  );
}

export default function DebugNotificationsPromptQA() {
  const dispatch = useDispatch();
  const [tab, setTab] = useState<TabId>("scenarios");
  const [selectedSource, setSelectedSource] = useState<NotificationsQaTriggerSource>("onboarding");
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [previewTarget, setPreviewTarget] =
    useState<NotificationPromptTarget>("globalPushNotifications");
  const [hasSimulatedPermission, setHasSimulatedPermission] = useState(false);
  const [evaluationNow, setEvaluationNow] = useState(() => Date.now());
  const [isBaselineCaptured, setBaselineCaptured] = useState(false);

  const brazePushNotifications = useFeature("brazePushNotifications");
  const notifications = useSelector(notificationsSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const { permissionStatus, setPermissionStatus } = useNotificationsPermission();
  const { pushNotificationsDataOfUser, updatePushNotificationsDataOfUserInStateAndStore } =
    useNotificationsData();
  const { notifyFlowCompleted, openDrawer, isDrawerPending, cancelPendingDrawer } =
    useNotificationsPrompt();

  const initialStateRef = useRef<{
    permissionStatus: NonNullable<typeof permissionStatus>;
    notifications: typeof notifications;
    hasCompletedOnboarding: boolean;
    pushNotificationsDataOfUser: typeof pushNotificationsDataOfUser;
  } | null>(null);

  useEffect(() => {
    if (
      initialStateRef.current === null &&
      permissionStatus !== null &&
      permissionStatus !== undefined
    ) {
      initialStateRef.current = {
        permissionStatus,
        notifications,
        hasCompletedOnboarding,
        pushNotificationsDataOfUser,
      };
      setBaselineCaptured(true);
    }
  }, [hasCompletedOnboarding, notifications, permissionStatus, pushNotificationsDataOfUser]);

  const globalDismissals = useMemo(
    () => getGlobalPushNotificationsDismissals(pushNotificationsDataOfUser),
    [pushNotificationsDataOfUser],
  );

  const decision = useMemo<AfterActionTriggerDecision | InactivityTriggerDecision>(() => {
    const context = {
      brazePushNotifications,
      isRatingsModalOpen,
      isDrawerPending: isDrawerPending(),
      now: evaluationNow,
    };

    if (selectedSource === "inactivity") {
      return evaluateInactivityTrigger(
        {
          permissionStatus,
          areNotificationsAllowed: notifications.areNotificationsAllowed,
          pushNotificationsDataOfUser,
          hasCompletedOnboarding,
        },
        context,
      );
    }

    return evaluateAfterActionTrigger(
      {
        source: selectedSource,
        permissionStatus,
        areNotificationsAllowed: notifications.areNotificationsAllowed,
        transactionsAlertsCategory: notifications.transactionsAlertsCategory,
        pushNotificationsDataOfUser,
      },
      context,
    );
  }, [
    brazePushNotifications,
    evaluationNow,
    hasCompletedOnboarding,
    isDrawerPending,
    isRatingsModalOpen,
    notifications.areNotificationsAllowed,
    notifications.transactionsAlertsCategory,
    permissionStatus,
    pushNotificationsDataOfUser,
    selectedSource,
  ]);

  const verdict = mapNotificationsDecisionToQaExpectation(decision);
  const verdictMeta = NOTIFICATIONS_QA_VERDICT_META[verdict];
  const reason =
    decision.kind === "show" ? "Eligible now" : NOTIFICATIONS_PROMPT_REASON_LABEL[decision.reason];
  const rawReason = decision.kind === "show" ? "kind: show" : `reason: ${decision.reason}`;
  const resolvedPromptTarget =
    decision.kind === "show"
      ? decision.drawerPromptTarget
      : (getNotificationPromptTarget({
          permissionStatus,
          areNotificationsAllowed: notifications.areNotificationsAllowed,
          transactionsAlertsCategory: notifications.transactionsAlertsCategory,
        }) ?? "globalPushNotifications");

  const selectedActionEvent = (() => {
    if (selectedSource === "inactivity") return undefined;
    const actionEventKey = selectedSource === "onboarding" ? "complete_onboarding" : selectedSource;
    return brazePushNotifications?.params?.action_events?.[actionEventKey];
  })();
  const afterActionRepromptLabel = getAfterActionRepromptLabel({
    dismissedOptInDrawerAtList: globalDismissals,
    repromptSchedule: brazePushNotifications?.params?.reprompt_schedule,
    now: evaluationNow,
  });
  const inactivityRepromptLabel = getInactivityRepromptLabel({
    lastActionAt: pushNotificationsDataOfUser?.lastActionAt,
    inactivityReprompt: brazePushNotifications?.params?.inactivity_reprompt,
    inactivityEnabled: brazePushNotifications?.params?.inactivity_enabled,
    now: evaluationNow,
  });

  const applyScenario = useCallback(
    (scenario: NotificationsQaScenario) => {
      const now = Date.now();
      const userData = buildNotificationsQaScenarioUserData(scenario, {
        repromptSchedule: brazePushNotifications?.params?.reprompt_schedule,
        inactivityReprompt: brazePushNotifications?.params?.inactivity_reprompt,
        now,
      });

      dispatch(
        setOverride({
          key: "brazePushNotifications",
          value: {
            ...brazePushNotifications,
            enabled: true,
            params: brazePushNotifications?.params ?? {},
          },
        }),
      );
      cancelPendingDrawer();
      dispatch(setNotificationsModalOpen(false));
      dispatch(setNotificationsDrawerSource(undefined));
      dispatch(setNotificationsDrawerPromptTarget(undefined));
      setPermissionStatus(scenario.permissionStatus);
      setHasSimulatedPermission(true);
      dispatch(
        setNotifications({
          ...notifications,
          areNotificationsAllowed: scenario.areNotificationsAllowed,
          transactionsAlertsCategory: scenario.transactionsAlertsCategory,
        }),
      );
      dispatch(completeOnboarding(scenario.hasCompletedOnboarding));
      updatePushNotificationsDataOfUserInStateAndStore(userData);
      setSelectedSource(scenario.source);
      setPreviewOpen(false);
      setEvaluationNow(now);
    },
    [
      brazePushNotifications,
      cancelPendingDrawer,
      dispatch,
      notifications,
      setPermissionStatus,
      updatePushNotificationsDataOfUserInStateAndStore,
    ],
  );

  const onResetAll = useCallback(() => {
    const initialState = initialStateRef.current;
    cancelPendingDrawer();
    dispatch(setOverride({ key: "brazePushNotifications", value: undefined }));
    if (initialState) {
      updatePushNotificationsDataOfUserInStateAndStore(
        initialState.pushNotificationsDataOfUser ?? {},
      );
      dispatch(setNotifications(initialState.notifications));
      dispatch(completeOnboarding(initialState.hasCompletedOnboarding));
      setPermissionStatus(initialState.permissionStatus);
    }
    dispatch(setNotificationsModalOpen(false));
    dispatch(setNotificationsDrawerSource(undefined));
    dispatch(setNotificationsDrawerPromptTarget(undefined));
    setSelectedSource("onboarding");
    setPreviewOpen(false);
    setHasSimulatedPermission(false);
    setEvaluationNow(Date.now());
  }, [
    cancelPendingDrawer,
    dispatch,
    setPermissionStatus,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);

  const onPreviewDrawer = useCallback(() => {
    setPreviewTarget(resolvedPromptTarget);
    setPreviewOpen(true);
  }, [resolvedPromptTarget]);

  const onTriggerProductionDrawer = useCallback(() => {
    setPreviewOpen(false);
    cancelPendingDrawer();
    const now = Date.now();
    setEvaluationNow(now);

    if (selectedSource === "inactivity") {
      const inactivityDecision = evaluateInactivityTrigger(
        {
          permissionStatus,
          areNotificationsAllowed: notifications.areNotificationsAllowed,
          pushNotificationsDataOfUser,
          hasCompletedOnboarding,
        },
        {
          brazePushNotifications,
          isRatingsModalOpen,
          isDrawerPending: isDrawerPending(),
          now,
        },
      );
      if (inactivityDecision.kind === "show") {
        openDrawer(
          inactivityDecision.source,
          inactivityDecision.delayMs,
          inactivityDecision.drawerPromptTarget,
        );
      }
      return;
    }
    notifyFlowCompleted(selectedSource);
  }, [
    brazePushNotifications,
    cancelPendingDrawer,
    hasCompletedOnboarding,
    isDrawerPending,
    isRatingsModalOpen,
    notifyFlowCompleted,
    notifications.areNotificationsAllowed,
    openDrawer,
    permissionStatus,
    pushNotificationsDataOfUser,
    selectedSource,
  ]);

  const onForceOpenDrawer = useCallback(() => {
    setPreviewOpen(false);
    cancelPendingDrawer();
    const source = selectedSource === "inactivity" ? "inactivity" : selectedSource;
    openDrawer(source, 0, resolvedPromptTarget);
  }, [cancelPendingDrawer, openDrawer, resolvedPromptTarget, selectedSource]);

  const onMarkInactive = useCallback(() => {
    const now = Date.now();
    updatePushNotificationsDataOfUserInStateAndStore(
      buildInactiveUserData(
        pushNotificationsDataOfUser,
        brazePushNotifications?.params?.inactivity_reprompt,
        now,
      ),
    );
    setSelectedSource("inactivity");
    setEvaluationNow(now);
  }, [
    brazePushNotifications?.params?.inactivity_reprompt,
    pushNotificationsDataOfUser,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);

  const onMarkRepromptable = useCallback(() => {
    const now = Date.now();
    updatePushNotificationsDataOfUserInStateAndStore(
      buildRepromptableUserData(
        pushNotificationsDataOfUser,
        brazePushNotifications?.params?.reprompt_schedule,
        now,
      ),
    );
    setEvaluationNow(now);
  }, [
    brazePushNotifications?.params?.reprompt_schedule,
    pushNotificationsDataOfUser,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);

  const onKeepTwoDismissals = useCallback(() => {
    updatePushNotificationsDataOfUserInStateAndStore(
      buildTruncatedDismissalsUserData(pushNotificationsDataOfUser, 2),
    );
  }, [pushNotificationsDataOfUser, updatePushNotificationsDataOfUserInStateAndStore]);

  const inspectorFields: InspectorField[] = [
    {
      label: "OS notification permission",
      value: formatPermissionStatus(permissionStatus),
      raw: `permissionStatus: ${String(permissionStatus)}${
        hasSimulatedPermission ? " · simulated until app foreground sync" : ""
      }`,
      status: {
        label: permissionStatus === AuthorizationStatus.AUTHORIZED ? "On" : "Off",
        tone: permissionStatus === AuthorizationStatus.AUTHORIZED ? "success" : "gray",
      },
    },
    {
      label: "App notifications",
      value: notifications.areNotificationsAllowed ? "Enabled" : "Disabled",
      raw: `areNotificationsAllowed: ${String(notifications.areNotificationsAllowed)}`,
      status: {
        label: notifications.areNotificationsAllowed ? "On" : "Off",
        tone: notifications.areNotificationsAllowed ? "success" : "gray",
      },
    },
    {
      label: "Transaction alerts",
      value: notifications.transactionsAlertsCategory ? "Enabled" : "Disabled",
      raw: `transactionsAlertsCategory: ${String(notifications.transactionsAlertsCategory)}`,
      status: {
        label: notifications.transactionsAlertsCategory ? "On" : "Off",
        tone: notifications.transactionsAlertsCategory ? "success" : "gray",
      },
    },
    {
      label: "Onboarding",
      value: hasCompletedOnboarding ? "Complete" : "Incomplete",
      raw: `hasCompletedOnboarding: ${String(hasCompletedOnboarding)}`,
      status: {
        label: hasCompletedOnboarding ? "Ready" : "Blocked",
        tone: hasCompletedOnboarding ? "success" : "error",
      },
    },
    {
      label: "Stored dismissals",
      value: `${globalDismissals?.length ?? 0} dismissal(s)`,
      raw: `globalPushNotifications: ${JSON.stringify(globalDismissals ?? [])}`,
      status: {
        label: globalDismissals?.length ? "Saved" : "Empty",
        tone: "gray",
      },
    },
    {
      label: "Last activity",
      value: pushNotificationsDataOfUser?.lastActionAt
        ? formatDismissalTimestamp(pushNotificationsDataOfUser.lastActionAt).local
        : "Missing",
      raw: `lastActionAt: ${String(pushNotificationsDataOfUser?.lastActionAt)}`,
      status: {
        label: pushNotificationsDataOfUser?.lastActionAt ? "Saved" : "Missing",
        tone: "gray",
      },
    },
  ];

  return (
    <Box lx={{ flex: 1 }}>
      <TrackScreen category="Settings" name="DebugNotificationsPromptQA" />
      <QueuedDrawer
        isRequestingToBeOpened={isPreviewOpen}
        noCloseButton
        onClose={() => setPreviewOpen(false)}
        onBackdropPress={() => setPreviewOpen(false)}
      >
        <NotificationsPromptDrawerView
          promptTarget={previewTarget}
          onAllow={() => setPreviewOpen(false)}
          onLater={() => setPreviewOpen(false)}
        />
      </QueuedDrawer>

      <SettingsNavigationScrollView>
        <Box
          lx={{
            paddingHorizontal: "s24",
            paddingBottom: "s24",
            paddingTop: "s16",
            gap: "s16",
          }}
        >
          <Text typography="body2SemiBold" lx={{ color: "muted" }}>
            NOTIFICATIONS PROMPT — QA
          </Text>

          <Box
            lx={{
              backgroundColor: "muted",
              borderRadius: "md",
              padding: "s16",
              gap: "s12",
            }}
          >
            <Box lx={{ gap: "s4" }}>
              <Text typography="heading3SemiBold" lx={{ color: verdictMeta.tone }}>
                {verdict}
              </Text>
              <Text typography="body3" lx={{ color: "muted" }}>
                {verdictMeta.hint}
              </Text>
            </Box>

            <Box lx={{ gap: "s8" }}>
              <Box lx={{ gap: "s2" }}>
                <Text typography="body3" lx={{ color: "muted" }}>
                  Reason
                </Text>
                <Text typography="body2SemiBold" lx={{ color: "base" }}>
                  {reason}
                </Text>
                <Text typography="body3" lx={{ color: "muted" }}>
                  {rawReason}
                </Text>
              </Box>
              <Box lx={{ gap: "s2" }}>
                <Text typography="body3" lx={{ color: "muted" }}>
                  Evaluation
                </Text>
                <Text typography="body2SemiBold" lx={{ color: "base" }}>
                  {SOURCE_LABEL[selectedSource]} · {resolvedPromptTarget}
                </Text>
                <Text typography="body3" lx={{ color: "muted" }}>
                  {decision.kind === "show"
                    ? `Delay: ${decision.delayMs} ms`
                    : `Dismissals: ${decision.dismissedCount}`}
                </Text>
              </Box>
            </Box>

            <Divider />

            <Box lx={{ gap: "s8" }}>
              <Button appearance="accent" size="sm" onPress={onPreviewDrawer}>
                Preview drawer
              </Button>
              <Text typography="body3" lx={{ color: "muted" }}>
                Visual preview only. Buttons close it without changing notification state.
              </Text>
            </Box>
          </Box>

          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
            <Box lx={{ flex: 1 }}>
              <SegmentedControl
                selectedValue={tab}
                onSelectedChange={setTab}
                tabLayout="fit"
                accessibilityLabel="Notifications prompt QA sections"
              >
                <SegmentedControlButton value="scenarios">Scenarios</SegmentedControlButton>
                <SegmentedControlButton value="inspect">Inspect</SegmentedControlButton>
              </SegmentedControl>
            </Box>
            <Button
              appearance="no-background"
              size="sm"
              disabled={!isBaselineCaptured}
              onPress={() =>
                confirm(
                  "Reset all",
                  "Restores the prompt state from when this screen opened and clears QA overrides. The app cannot change the real OS permission.",
                  "Reset",
                  onResetAll,
                )
              }
            >
              Reset all
            </Button>
          </Box>

          {tab === "scenarios" ? (
            <Box>
              {NOTIFICATIONS_QA_GROUPS.map((expectation, index) => {
                const meta = NOTIFICATIONS_QA_VERDICT_META[expectation];
                const scenarios = NOTIFICATIONS_QA_SCENARIOS.filter(
                  scenario => scenario.expected === expectation,
                );
                if (scenarios.length === 0) return null;

                return (
                  <Box key={expectation}>
                    <Box
                      lx={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "s8",
                        marginTop: index === 0 ? undefined : "s16",
                        marginBottom: "s8",
                      }}
                    >
                      <Tag label={expectation} size="sm" appearance={meta.tone} />
                      <Text typography="body3" lx={{ color: "muted", flex: 1 }}>
                        {meta.hint}
                      </Text>
                    </Box>
                    <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
                      {scenarios.map(scenario => (
                        <TouchableOpacity
                          key={scenario.id}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`Apply ${scenario.name} scenario`}
                          style={{ flexBasis: "47%", flexGrow: 1 }}
                          onPress={() =>
                            confirm(
                              scenario.name,
                              `${scenario.summary}\n\nExpected: ${scenario.expected}.`,
                              "Apply",
                              () => applyScenario(scenario),
                            )
                          }
                        >
                          <Box
                            lx={{
                              gap: "s8",
                              padding: "s12",
                              borderRadius: "sm",
                              borderWidth: "s1",
                              borderColor: "muted",
                              backgroundColor: "baseTransparent",
                            }}
                          >
                            <Tag label={scenario.expected} size="sm" appearance={meta.tone} />
                            <Text typography="body2SemiBold" lx={{ color: "base" }}>
                              {scenario.name}
                            </Text>
                            <Text typography="body3" lx={{ color: "muted" }}>
                              {scenario.summary}
                            </Text>
                          </Box>
                        </TouchableOpacity>
                      ))}
                    </Box>
                  </Box>
                );
              })}

              <Text
                typography="body3SemiBold"
                lx={{ color: "muted", marginTop: "s16", marginBottom: "s8" }}
              >
                Trigger source
              </Text>
              <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
                {TRIGGER_SOURCES.map(source => (
                  <Button
                    key={source}
                    size="sm"
                    appearance={selectedSource === source ? "accent" : "base"}
                    onPress={() => setSelectedSource(source)}
                  >
                    {SOURCE_LABEL[source]}
                  </Button>
                ))}
              </Box>

              <Box lx={{ gap: "s8", marginTop: "s16" }}>
                <Button appearance="accent" onPress={onTriggerProductionDrawer}>
                  Trigger drawer with production rules
                </Button>
                <Button appearance="base" onPress={onForceOpenDrawer}>
                  Force open global drawer — bypass rules
                </Button>
                <Text typography="body3" lx={{ color: "muted" }}>
                  The production trigger uses the real engine and configured delay. Force open
                  bypasses eligibility and runs the real drawer handlers.
                </Text>
              </Box>

              <Text
                typography="body3SemiBold"
                lx={{ color: "muted", marginTop: "s16", marginBottom: "s8" }}
              >
                Advanced state actions
              </Text>
              <Box lx={{ gap: "s8" }}>
                <Button appearance="base" size="sm" onPress={onMarkInactive}>
                  Make inactivity eligible
                </Button>
                <Button appearance="base" size="sm" onPress={onMarkRepromptable}>
                  Make after-action eligible
                </Button>
                <Button appearance="base" size="sm" onPress={onKeepTwoDismissals}>
                  Keep only first two dismissals
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Text typography="body3SemiBold" lx={{ color: "muted", marginBottom: "s4" }}>
                Current user and device state
              </Text>
              {inspectorFields.map(field => (
                <InspectorRow key={field.label} field={field} />
              ))}

              <Text
                typography="body3SemiBold"
                lx={{ color: "muted", marginTop: "s16", marginBottom: "s4" }}
              >
                Production decision
              </Text>
              <InspectorRow
                field={{
                  label: "Selected trigger",
                  value: SOURCE_LABEL[selectedSource],
                  raw: `source: ${selectedSource}`,
                  status: {
                    label: decision.kind === "show" ? "Show" : "Skip",
                    tone: verdictMeta.tone,
                  },
                }}
              />
              <InspectorRow
                field={{
                  label: "Drawer target",
                  value: resolvedPromptTarget,
                  raw: `dismissedCount: ${decision.dismissedCount}`,
                  status: { label: "Resolved", tone: "success" },
                }}
              />

              <Text
                typography="body3SemiBold"
                lx={{ color: "muted", marginTop: "s16", marginBottom: "s4" }}
              >
                Feature configuration
              </Text>
              <InspectorRow
                field={{
                  label: "Braze notifications prompt",
                  value: brazePushNotifications?.enabled ? "Enabled" : "Disabled",
                  raw: "feature: brazePushNotifications",
                  status: {
                    label: brazePushNotifications?.enabled ? "On" : "Off",
                    tone: brazePushNotifications?.enabled ? "success" : "error",
                  },
                }}
              />
              {selectedSource === "inactivity" ? (
                <InspectorRow
                  field={{
                    label: "Inactivity prompt",
                    value: brazePushNotifications?.params?.inactivity_enabled
                      ? "Enabled"
                      : "Disabled",
                    raw: `inactivity_reprompt: ${formatDelay(
                      brazePushNotifications?.params?.inactivity_reprompt,
                    )}`,
                    status: {
                      label: brazePushNotifications?.params?.inactivity_enabled ? "On" : "Off",
                      tone: brazePushNotifications?.params?.inactivity_enabled
                        ? "success"
                        : "error",
                    },
                  }}
                />
              ) : (
                <InspectorRow
                  field={{
                    label: `${SOURCE_LABEL[selectedSource]} action`,
                    value: selectedActionEvent?.enabled ? "Enabled" : "Disabled",
                    raw: `timer: ${selectedActionEvent?.timer ?? "missing"} ms`,
                    status: {
                      label: selectedActionEvent?.enabled ? "On" : "Off",
                      tone: selectedActionEvent?.enabled ? "success" : "error",
                    },
                  }}
                />
              )}
              <InspectorRow
                field={{
                  label: "After-action reprompt",
                  value: afterActionRepromptLabel,
                  raw: `reprompt_schedule: ${
                    brazePushNotifications?.params?.reprompt_schedule?.length ?? 0
                  } step(s)`,
                  status: {
                    label: afterActionRepromptLabel.includes("eligible") ? "Ready" : "Waiting",
                    tone: afterActionRepromptLabel.includes("eligible") ? "success" : "warning",
                  },
                }}
              />
              <InspectorRow
                field={{
                  label: "Inactivity reprompt",
                  value: inactivityRepromptLabel,
                  raw: `inactivity_reprompt: ${formatDelay(
                    brazePushNotifications?.params?.inactivity_reprompt,
                  )}`,
                  status: {
                    label: inactivityRepromptLabel.includes("eligible") ? "Ready" : "Waiting",
                    tone: inactivityRepromptLabel.includes("eligible") ? "success" : "warning",
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </SettingsNavigationScrollView>
    </Box>
  );
}
