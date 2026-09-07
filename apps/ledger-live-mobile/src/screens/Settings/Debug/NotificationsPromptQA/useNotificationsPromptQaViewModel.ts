import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import {
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
  getNotificationPromptTarget,
  type AfterActionTriggerDecision,
  type InactivityTriggerDecision,
} from "LLM/features/NotificationsPrompt/utils/notificationsPromptEngine";
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt/new/NotificationsPromptProvider";
import { useNotificationsData } from "LLM/features/NotificationsPrompt/hooks/useNotificationsData";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  setNotificationsDrawerPromptTarget,
  setNotificationsDrawerSource,
  setNotificationsModalOpen,
} from "~/actions/notifications";
import { completeOnboarding, setNotifications } from "~/actions/settings";
import { ratingsModalOpenSelector } from "~/reducers/ratings";
import { hasCompletedOnboardingSelector, notificationsSelector } from "~/reducers/settings";
import {
  buildDecisionInspectorFields,
  buildFeatureInspectorFields,
  buildInactiveUserData,
  buildNotificationsQaScenarioUserData,
  buildRepromptableUserData,
  buildTruncatedDismissalsUserData,
  buildUserStateInspectorFields,
  getAfterActionRepromptLabel,
  getForceOpenDrawerLabel,
  getGlobalPushNotificationsDismissals,
  getInactivityRepromptLabel,
  getNotificationsQaHeadline,
  NOTIFICATIONS_QA_VERDICT_META,
  SOURCE_LABEL,
  type NotificationsQaScenario,
  type NotificationsQaTriggerSource,
} from "./utils";

export function useNotificationsPromptQaViewModel() {
  const dispatch = useDispatch();
  const [selectedSource, setSelectedSource] = useState<NotificationsQaTriggerSource>("onboarding");
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

  const { verdict, reason, rawReason } = getNotificationsQaHeadline(decision);
  const verdictMeta = NOTIFICATIONS_QA_VERDICT_META[verdict];
  const resolvedPromptTarget =
    decision.kind === "show"
      ? decision.drawerPromptTarget
      : (getNotificationPromptTarget({
          permissionStatus,
          areNotificationsAllowed: notifications.areNotificationsAllowed,
          transactionsAlertsCategory: notifications.transactionsAlertsCategory,
        }) ?? "globalPushNotifications");

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
      if (initialStateRef.current === null) return;

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
    setHasSimulatedPermission(false);
    setEvaluationNow(Date.now());
  }, [
    cancelPendingDrawer,
    dispatch,
    setPermissionStatus,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);

  const onTriggerProductionDrawer = useCallback(() => {
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
    cancelPendingDrawer();
    const source = selectedSource === "inactivity" ? "inactivity" : selectedSource;
    openDrawer(source, 0, resolvedPromptTarget);
  }, [cancelPendingDrawer, openDrawer, resolvedPromptTarget, selectedSource]);

  const onMarkInactive = useCallback(() => {
    if (initialStateRef.current === null) return;

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
    if (initialStateRef.current === null) return;

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
    if (initialStateRef.current === null) return;

    updatePushNotificationsDataOfUserInStateAndStore(
      buildTruncatedDismissalsUserData(pushNotificationsDataOfUser, 2),
    );
  }, [pushNotificationsDataOfUser, updatePushNotificationsDataOfUserInStateAndStore]);

  const userStateFields = buildUserStateInspectorFields({
    permissionStatus,
    hasSimulatedPermission,
    areNotificationsAllowed: notifications.areNotificationsAllowed,
    transactionsAlertsCategory: notifications.transactionsAlertsCategory,
    hasCompletedOnboarding,
    globalDismissals,
    lastActionAt: pushNotificationsDataOfUser?.lastActionAt,
  });
  const decisionFields = buildDecisionInspectorFields({
    selectedSource,
    decision,
    resolvedPromptTarget,
    verdictTone: verdictMeta.tone,
  });
  const featureFields = buildFeatureInspectorFields({
    selectedSource,
    brazePushNotifications,
    afterActionRepromptLabel,
    inactivityRepromptLabel,
  });

  return {
    selectedSource,
    setSelectedSource,
    isBaselineCaptured,
    verdict,
    verdictMeta,
    reason,
    rawReason,
    resolvedPromptTarget,
    forceOpenDrawerLabel: getForceOpenDrawerLabel(resolvedPromptTarget),
    decision,
    sourceLabel: SOURCE_LABEL[selectedSource],
    applyScenario,
    onResetAll,
    onTriggerProductionDrawer,
    onForceOpenDrawer,
    onMarkInactive,
    onMarkRepromptable,
    onKeepTwoDismissals,
    userStateFields,
    decisionFields,
    featureFields,
  };
}
