import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { useFeature } from "@features/platform-feature-flags";
import { featureFlagsOverridesSelector, setOverride } from "@shared/feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { setNotifications } from "~/actions/settings";
import { notificationsSelector, hasCompletedOnboardingSelector } from "~/reducers/settings";
import { ratingsModalOpenSelector } from "~/reducers/ratings";
import { NavigatorName, ScreenName } from "~/const";
import type {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { useOpenSwap } from "LLM/features/Swap";
import { useOpenStakeDrawer } from "LLM/features/Stake";
import {
  AFTER_ACTION_SOURCE_TO_EVENT_KEY,
  canPromptTransactionsAlertsForAction,
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
  getNotificationPromptTarget,
  useNotificationsContext,
  useNotificationsData,
  type AfterActionTriggerDecision,
  type InactivityTriggerDecision,
  type NotificationsPromptAfterActionSource,
  type NotificationsPromptSkipReason,
} from "LLM/features/NotificationsPrompt";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import { useNotificationsPromptDrawerScheduler } from "LLM/features/NotificationsPrompt/new/hooks/useNotificationsPromptDrawerScheduler";
import {
  buildActionEventToggleOverride,
  buildAfterActionTrace,
  buildFastQaFeatureOverride,
  buildInactiveUserData,
  buildInactivityTrace,
  buildRepromptableUserData,
  buildTransactionsAlertsPromptToggleOverride,
  buildTruncatedDismissalsUserData,
  formatTimestamp,
  getDismissalsForTarget,
  getInactivityRepromptTiming,
  getRepromptTiming,
  type TraceStep,
} from "../../utils/notificationsPromptDebug";

const FEATURE_FLAG_KEY = "brazePushNotifications" as const;

const ACTION_SOURCES: { value: NotificationsPromptAfterActionSource; label: string }[] = [
  { value: "onboarding", label: "Onboarding" },
  { value: "send", label: "Send" },
  { value: "receive", label: "Receive" },
  { value: "dapp_complete", label: "DApp" },
  { value: "swap", label: "Swap" },
  { value: "stake", label: "Stake" },
  { value: "add_favorite_coin", label: "Favorite" },
];

const SKIP_REASON_COPY: Record<
  NotificationsPromptSkipReason,
  { headline: string; severity: "blocker" | "info" }
> = {
  feature_disabled: {
    headline: "brazePushNotifications (or a required sub-flag) is disabled.",
    severity: "blocker",
  },
  configuration_missing: {
    headline: "Required remote configuration is missing for this check.",
    severity: "blocker",
  },
  ratings_modal_open: {
    headline: "The App Store ratings modal is currently open.",
    severity: "blocker",
  },
  drawer_already_pending: {
    headline: "Another notifications drawer is already open or scheduled.",
    severity: "blocker",
  },
  fully_opted_in: {
    headline: "Already fully opted in — nothing left to prompt for.",
    severity: "info",
  },
  reprompt_delay_not_reached: {
    headline: "The dismissal cooldown hasn't elapsed yet.",
    severity: "info",
  },
  action_event_disabled: {
    headline: "This action is disabled in action_events.",
    severity: "blocker",
  },
  transactions_alerts_not_eligible: {
    headline: "Transaction alerts aren't configured to prompt for this action.",
    severity: "blocker",
  },
  onboarding_incomplete: {
    headline: "The user hasn't completed onboarding yet.",
    severity: "info",
  },
  user_not_inactive: {
    headline: "The user hasn't been inactive long enough yet.",
    severity: "info",
  },
  globally_opted_in_no_inactivity_drawer: {
    headline: "Already opted in to global push — inactivity only targets that.",
    severity: "info",
  },
};

const TARGET_LABEL: Record<"globalPushNotifications" | "transactionsAlertsCategory", string> = {
  globalPushNotifications: "Global push opt-in",
  transactionsAlertsCategory: "Transaction alerts",
};

export type NotificationsPromptQADebugMode = "action" | "inactivity";
export type NotificationsPromptQADebugTab = NotificationsPromptQADebugMode | "config";

export type NotificationsPromptQADebugHero = {
  wouldShow: boolean;
  appearance: "success" | "warning" | "error";
  title: string;
  description: string;
};

/** Verdict for one specific prompt target, shown as its own row on the "After an action" tab. */
export type PromptTargetVerdict = {
  target: "globalPushNotifications" | "transactionsAlertsCategory";
  label: string;
  isLive: boolean;
  wouldShow: boolean;
  reasonLabel: string | null;
};

/** Static (selectedSource-independent) breakdown for the "Transaction alerts" row. */
export type TransactionsAlertsOverview = {
  isLive: boolean;
  blockedReason: string | null;
  perSourceEligibility: {
    value: NotificationsPromptAfterActionSource;
    label: string;
    eligible: boolean;
  }[];
};

// Hypothetical opt-in input used to preview the "Global push opt-in" verdict when transaction
// alerts is the real live target right now. Only the opt-in fields matter here — everything
// else (dismissals, config, ratings modal, etc.) still comes from the real current state.
const HYPOTHETICAL_NOT_OPTED_IN = {
  permissionStatus: AuthorizationStatus.NOT_DETERMINED,
  areNotificationsAllowed: false,
} as const;

// "Go verify" — for each real per-action source, jump to the actual screen/flow that would
// normally trigger it, reusing existing routes/hooks (same ones the real quick actions use).
// Deliberately a tiny inline map (not a registry): there is exactly one caller and exactly 7
// sources, of which "onboarding" intentionally has no verify target.
const QA_DEBUG_SOURCE_SCREEN_NAME = "DebugNotificationsPromptQA";

const useLiveNow = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
};

export const useNotificationsPromptQADebugViewModel = () => {
  const dispatch = useDispatch();
  const navigation =
    useNavigation<
      BaseNavigationComposite<StackNavigatorNavigation<SettingsNavigatorStackParamList>>
    >();
  const now = useLiveNow();

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName: QA_DEBUG_SOURCE_SCREEN_NAME,
  });
  const { handleOpenSwap } = useOpenSwap({ sourceScreenName: QA_DEBUG_SOURCE_SCREEN_NAME });
  const { handleOpenStakeDrawer } = useOpenStakeDrawer({
    sourceScreenName: QA_DEBUG_SOURCE_SCREEN_NAME,
  });
  const goVerifyBySource: Partial<Record<NotificationsPromptAfterActionSource, () => void>> = {
    send: () => navigation.navigate(NavigatorName.SendFunds, { screen: ScreenName.SendCoin }),
    receive: handleOpenReceiveDrawer,
    swap: handleOpenSwap,
    stake: handleOpenStakeDrawer,
    dapp_complete: () =>
      navigation.navigate(NavigatorName.Discover, { screen: ScreenName.DiscoverScreen }),
    add_favorite_coin: () => navigation.navigate(ScreenName.MarketList),
  };

  // `activeTab` drives the SegmentedControl (3 tabs). `mode` tracks which trace ("action" or
  // "inactivity") the decision/trace/scenario-prep controls apply to — it stays on its last
  // value while the user is on the "config" tab, so config-tab scenario actions keep acting on
  // whichever trace the user was just looking at.
  const [activeTab, setActiveTabState] = useState<NotificationsPromptQADebugTab>("action");
  const [mode, setMode] = useState<NotificationsPromptQADebugMode>("action");
  const setActiveTab = useCallback((tab: NotificationsPromptQADebugTab) => {
    setActiveTabState(tab);
    if (tab !== "config") setMode(tab);
  }, []);

  const [selectedSource, setSelectedSource] =
    useState<NotificationsPromptAfterActionSource>("send");
  const goVerify = goVerifyBySource[selectedSource] ?? null;

  const brazePushNotifications = useFeature(FEATURE_FLAG_KEY);
  const overrides = useSelector(featureFlagsOverridesSelector);
  const isOverridden = overrides[FEATURE_FLAG_KEY] !== undefined;

  const notifications = useSelector(notificationsSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);

  const { permissionStatus, setPermissionStatus } = useNotificationsPermission();
  const {
    pushNotificationsDataOfUser,
    updatePushNotificationsDataOfUserInStateAndStore,
    enableAppNotifications,
    markUserAsOptIn,
    markUserAsOptOut,
  } = useNotificationsData();
  const { notifyFlowCompleted, tryTriggerPushNotificationDrawerAfterInactivity } =
    useNotificationsContext();
  const { openDrawer, isDrawerPending } = useNotificationsPromptDrawerScheduler();

  const { areNotificationsAllowed, transactionsAlertsCategory } = notifications;
  const globallyOptedIn =
    permissionStatus === AuthorizationStatus.AUTHORIZED && areNotificationsAllowed === true;
  const promptTarget = getNotificationPromptTarget({
    permissionStatus,
    areNotificationsAllowed,
    transactionsAlertsCategory,
  });
  const isDrawerBusy = isDrawerPending();

  const evaluationContext = useMemo(
    () => ({ brazePushNotifications, isRatingsModalOpen, isDrawerPending: isDrawerBusy, now }),
    [brazePushNotifications, isRatingsModalOpen, isDrawerBusy, now],
  );

  const afterActionDecision: AfterActionTriggerDecision = useMemo(
    () =>
      evaluateAfterActionTrigger(
        {
          source: selectedSource,
          permissionStatus,
          areNotificationsAllowed,
          transactionsAlertsCategory,
          pushNotificationsDataOfUser,
        },
        evaluationContext,
      ),
    [
      selectedSource,
      permissionStatus,
      areNotificationsAllowed,
      transactionsAlertsCategory,
      pushNotificationsDataOfUser,
      evaluationContext,
    ],
  );

  const inactivityDecision: InactivityTriggerDecision = useMemo(
    () =>
      evaluateInactivityTrigger(
        {
          permissionStatus,
          areNotificationsAllowed,
          pushNotificationsDataOfUser,
          hasCompletedOnboarding,
        },
        evaluationContext,
      ),
    [
      permissionStatus,
      areNotificationsAllowed,
      pushNotificationsDataOfUser,
      hasCompletedOnboarding,
      evaluationContext,
    ],
  );

  const decision = mode === "action" ? afterActionDecision : inactivityDecision;

  const hasActionEventsConfig = !!brazePushNotifications?.params?.action_events;
  const actionEventKey = AFTER_ACTION_SOURCE_TO_EVENT_KEY[selectedSource];
  const hasActionEventForSource = !!brazePushNotifications?.params?.action_events?.[actionEventKey];
  const selectedActionEvent = brazePushNotifications?.params?.action_events?.[actionEventKey];

  // --- Tab 1: dual prompt-target clarity ----------------------------------
  // A given action can only ever route to ONE of the two targets (per getNotificationPromptTarget).
  // For the target that isn't "live" right now, re-run the same engine function with a
  // hypothetical opt-in state so QA still sees a real (not fabricated) verdict for it.
  const globalPushDecision: AfterActionTriggerDecision = useMemo(
    () =>
      promptTarget === "globalPushNotifications"
        ? afterActionDecision
        : evaluateAfterActionTrigger(
            {
              source: selectedSource,
              ...HYPOTHETICAL_NOT_OPTED_IN,
              transactionsAlertsCategory,
              pushNotificationsDataOfUser,
            },
            evaluationContext,
          ),
    [
      promptTarget,
      afterActionDecision,
      selectedSource,
      transactionsAlertsCategory,
      pushNotificationsDataOfUser,
      evaluationContext,
    ],
  );

  const globalPushVerdict: PromptTargetVerdict = {
    target: "globalPushNotifications",
    label: TARGET_LABEL.globalPushNotifications,
    isLive: promptTarget === "globalPushNotifications",
    wouldShow: globalPushDecision.kind === "show",
    reasonLabel:
      globalPushDecision.kind === "skip"
        ? SKIP_REASON_COPY[globalPushDecision.reason].headline
        : null,
  };

  // Transaction alerts is intentionally NOT re-evaluated per selectedSource: QA found a single
  // "would show/blocked" verdict that silently changed as they clicked through sources confusing
  // (e.g. for "receive"). Instead this row shows only the gates that don't depend on which source
  // is selected, plus a static per-source breakdown against the real configured
  // `drawerPromptActions` list (via the same engine function used everywhere else).
  const transactionsAlertsBlockedReason = !brazePushNotifications?.enabled
    ? SKIP_REASON_COPY.feature_disabled.headline
    : isRatingsModalOpen
      ? SKIP_REASON_COPY.ratings_modal_open.headline
      : isDrawerBusy
        ? SKIP_REASON_COPY.drawer_already_pending.headline
        : transactionsAlertsCategory === true
          ? SKIP_REASON_COPY.fully_opted_in.headline
          : null;

  const transactionsAlertsOverview: TransactionsAlertsOverview = {
    isLive: promptTarget === "transactionsAlertsCategory",
    blockedReason: transactionsAlertsBlockedReason,
    perSourceEligibility: ACTION_SOURCES.map(source => ({
      value: source.value,
      label: source.label,
      eligible: canPromptTransactionsAlertsForAction(
        source.value,
        brazePushNotifications?.params?.notificationsCategories,
      ),
    })),
  };

  const trace: TraceStep[] = useMemo(
    () =>
      mode === "action"
        ? buildAfterActionTrace(afterActionDecision, {
            globallyOptedIn,
            hasActionEventsConfig,
            hasActionEventForSource,
          })
        : buildInactivityTrace(inactivityDecision, {
            isFeatureEnabled: !!brazePushNotifications?.enabled,
          }),
    [
      mode,
      afterActionDecision,
      inactivityDecision,
      globallyOptedIn,
      hasActionEventsConfig,
      hasActionEventForSource,
      brazePushNotifications?.enabled,
    ],
  );

  const hero: NotificationsPromptQADebugHero = useMemo(() => {
    if (decision.kind === "show") {
      return {
        wouldShow: true,
        appearance: "success",
        title: "Drawer would show",
        description: `Target: ${TARGET_LABEL[decision.drawerPromptTarget as keyof typeof TARGET_LABEL] ?? decision.drawerPromptTarget} · opens after ${decision.delayMs}ms`,
      };
    }

    const copy = SKIP_REASON_COPY[decision.reason];
    return {
      wouldShow: false,
      appearance: copy.severity === "info" ? "warning" : "error",
      title: "Drawer would not show",
      description: copy.headline,
    };
  }, [decision]);

  const timing =
    mode === "action"
      ? getRepromptTiming({
          dismissals: getDismissalsForTarget(
            pushNotificationsDataOfUser,
            promptTarget ?? "globalPushNotifications",
          ),
          repromptSchedule: brazePushNotifications?.params?.reprompt_schedule,
          now,
        })
      : getInactivityRepromptTiming({
          inactivityEnabled: brazePushNotifications?.params?.inactivity_enabled,
          inactivityReprompt: brazePushNotifications?.params?.inactivity_reprompt,
          lastActionAt: pushNotificationsDataOfUser?.lastActionAt,
          now,
        });

  // --- Tab 1/2: "Trigger via production rules" must reflect eligibility ---
  const canTriggerViaProductionRules = decision.kind === "show";
  const triggerViaProductionRulesDisabledReason =
    decision.kind === "skip" ? SKIP_REASON_COPY[decision.reason].headline : null;
  const triggerViaProductionRulesLabel =
    decision.kind === "show"
      ? `Trigger via production rules → opens ${TARGET_LABEL[decision.drawerPromptTarget as keyof typeof TARGET_LABEL] ?? decision.drawerPromptTarget} (real analytics)`
      : "Trigger via production rules (real analytics)";

  // --- Live actions -------------------------------------------------------

  const triggerViaProductionRules = useCallback(() => {
    if (!canTriggerViaProductionRules) return;

    if (mode === "action") {
      notifyFlowCompleted(selectedSource);
      return;
    }

    tryTriggerPushNotificationDrawerAfterInactivity({
      status: "success",
      storedUserData: pushNotificationsDataOfUser ?? null,
      osPermissionStatus: permissionStatus ?? AuthorizationStatus.NOT_DETERMINED,
      areAppNotificationsEnabled: notifications.areNotificationsAllowed ?? false,
    });
  }, [
    canTriggerViaProductionRules,
    mode,
    notifyFlowCompleted,
    selectedSource,
    tryTriggerPushNotificationDrawerAfterInactivity,
    pushNotificationsDataOfUser,
    permissionStatus,
    notifications.areNotificationsAllowed,
  ]);

  const forceOpenDrawer = useCallback(
    (target: "globalPushNotifications" | "transactionsAlertsCategory") => {
      openDrawer(mode === "action" ? selectedSource : "inactivity", 0, target);
    },
    [mode, selectedSource, openDrawer],
  );

  // --- Remote config overrides --------------------------------------------

  const toggleFeatureEnabled = useCallback(() => {
    dispatch(
      setOverride({
        key: FEATURE_FLAG_KEY,
        value: { ...brazePushNotifications, enabled: !brazePushNotifications?.enabled },
      }),
    );
  }, [dispatch, brazePushNotifications]);

  const applyFastQaConfig = useCallback(() => {
    dispatch(
      setOverride({
        key: FEATURE_FLAG_KEY,
        value: buildFastQaFeatureOverride(brazePushNotifications),
      }),
    );
  }, [dispatch, brazePushNotifications]);

  const toggleActionEventForSelectedSource = useCallback(() => {
    dispatch(
      setOverride({
        key: FEATURE_FLAG_KEY,
        value: buildActionEventToggleOverride(brazePushNotifications, selectedSource),
      }),
    );
  }, [dispatch, brazePushNotifications, selectedSource]);

  const toggleTransactionsAlertsPromptForSelectedSource = useCallback(() => {
    dispatch(
      setOverride({
        key: FEATURE_FLAG_KEY,
        value: buildTransactionsAlertsPromptToggleOverride(brazePushNotifications, selectedSource),
      }),
    );
  }, [dispatch, brazePushNotifications, selectedSource]);

  const restoreRemoteConfig = useCallback(() => {
    dispatch(setOverride({ key: FEATURE_FLAG_KEY, value: undefined }));
  }, [dispatch]);

  // --- User status: read-only + deep links to the real settings screens ---

  const navigateToNotificationsSettings = useCallback(() => {
    navigation.navigate(ScreenName.NotificationsSettings);
  }, [navigation]);

  const openOsSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  // --- Simulate user state (scenario prep with no real-screen equivalent) -

  const simulateFullOptIn = useCallback(() => {
    enableAppNotifications();
    setPermissionStatus(AuthorizationStatus.AUTHORIZED);
    markUserAsOptIn();
  }, [enableAppNotifications, setPermissionStatus, markUserAsOptIn]);

  const recordDismissalNow = useCallback(() => {
    markUserAsOptOut(promptTarget ?? undefined);
  }, [markUserAsOptOut, promptTarget]);

  const makeEligibleNow = useCallback(() => {
    const target = promptTarget ?? "globalPushNotifications";
    const next =
      mode === "action"
        ? buildRepromptableUserData(
            pushNotificationsDataOfUser,
            target,
            brazePushNotifications?.params?.reprompt_schedule,
            now,
          )
        : buildInactiveUserData(
            pushNotificationsDataOfUser,
            brazePushNotifications?.params?.inactivity_reprompt,
            now,
          );

    if (next) {
      updatePushNotificationsDataOfUserInStateAndStore(next);
    }
  }, [
    mode,
    promptTarget,
    pushNotificationsDataOfUser,
    brazePushNotifications?.params?.reprompt_schedule,
    brazePushNotifications?.params?.inactivity_reprompt,
    now,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);

  const truncateDismissals = useCallback(() => {
    updatePushNotificationsDataOfUserInStateAndStore(
      buildTruncatedDismissalsUserData(
        pushNotificationsDataOfUser,
        promptTarget ?? "globalPushNotifications",
        1,
      ),
    );
  }, [pushNotificationsDataOfUser, promptTarget, updatePushNotificationsDataOfUserInStateAndStore]);

  const resetAllQaState = useCallback(() => {
    updatePushNotificationsDataOfUserInStateAndStore({});
    dispatch(
      setNotifications({ areNotificationsAllowed: false, transactionsAlertsCategory: false }),
    );
    setPermissionStatus(AuthorizationStatus.NOT_DETERMINED);
  }, [updatePushNotificationsDataOfUserInStateAndStore, dispatch, setPermissionStatus]);

  const dismissalHistory = useMemo(() => {
    const dismissals =
      getDismissalsForTarget(
        pushNotificationsDataOfUser,
        promptTarget ?? "globalPushNotifications",
      ) ?? [];
    return dismissals
      .slice()
      .reverse()
      .map(timestamp => ({ timestamp, formatted: formatTimestamp(timestamp) }));
  }, [pushNotificationsDataOfUser, promptTarget]);

  return {
    activeTab,
    setActiveTab,
    mode,
    sources: ACTION_SOURCES,
    selectedSource,
    setSelectedSource,
    goVerify,
    hero,
    trace,
    timing,
    now,
    globalPushVerdict,
    transactionsAlertsOverview,
    canTriggerViaProductionRules,
    triggerViaProductionRulesDisabledReason,
    triggerViaProductionRulesLabel,
    permissionStatus,
    notifications,
    isFeatureEnabled: !!brazePushNotifications?.enabled,
    isOverridden,
    selectedActionEventEnabled: selectedActionEvent?.enabled ?? false,
    transactionsAlertsConfiguredForSelectedSource: canPromptTransactionsAlertsForAction(
      selectedSource,
      brazePushNotifications?.params?.notificationsCategories,
    ),
    dismissalHistory,
    triggerViaProductionRules,
    forceOpenDrawer,
    toggleFeatureEnabled,
    applyFastQaConfig,
    toggleActionEventForSelectedSource,
    toggleTransactionsAlertsPromptForSelectedSource,
    restoreRemoteConfig,
    navigateToNotificationsSettings,
    openOsSettings,
    simulateFullOptIn,
    recordDismissalNow,
    makeEligibleNow,
    truncateDismissals,
    resetAllQaState,
  };
};

export type NotificationsPromptQADebugViewModel = ReturnType<
  typeof useNotificationsPromptQADebugViewModel
>;
