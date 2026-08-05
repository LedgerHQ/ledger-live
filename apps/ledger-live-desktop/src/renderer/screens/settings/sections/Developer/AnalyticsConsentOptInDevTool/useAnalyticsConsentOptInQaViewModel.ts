import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useFeature } from "@features/platform-feature-flags";
import { featureFlagsOverridesSelector, setOverride } from "@shared/feature-flags";
import {
  parseConsentDate,
  parseStoredPolicyVersion,
  type AnalyticsConsentInfo,
  type PolicyVersion,
} from "@domain/entity-analytics-consent";
import {
  getConsentDateState,
  resolveAnalyticsConsentPhase,
  useAnalyticsConsentDecision,
  type ConsentDateState,
} from "@features/flow-analytics-consent";
import {
  mapDecisionToQaExpectation,
  QA_SCENARIOS,
  REASON_LABEL,
  resolveBaselinePolicyVersion,
  resolveScenarioConsentDate,
  resolveScenarioVersions,
  resolveStoredPolicyInspectorStatus,
  SCENARIO_GROUPS,
  SYNTHETIC_BASELINE,
  VERDICT_META,
  type QaScenario,
} from "@features/flow-analytics-consent/debug";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  setAnalyticsConsentInfo,
  setHasSeenAnalyticsOptInPrompt,
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";
import {
  analyticsConsentInfoSelector,
  hasCompletedOnboardingSelector,
  hasSeenAnalyticsOptInPromptSelector,
  shareAnalyticsSelector,
  sharePersonalizedRecommendationsSelector,
  trackingEnabledSelector,
} from "~/renderer/reducers/settings";

const FLAG_KEY = "analyticsOptIn";

export type TabId = "scenarios" | "inspect";

export type FieldTone = "success" | "error" | "warning" | "gray";

export type InspectorField = {
  label: string;
  value: string;
  raw?: string;
  status: { label: string; tone: FieldTone };
};

export type ToggleField = {
  label: string;
  value: boolean;
  note?: string;
  onChange: (value: boolean) => void;
};

type BlockedReason = keyof typeof BLOCKED_META;

const BLOCKED_META = {
  "analyticsOptIn flag is off": {
    hint: "Feature flag off. Turn on Feature flag enabled in Inspect.",
    previewHint: "Enable feature flag in Inspect first.",
  },
  "onboarding incomplete": {
    hint: "Onboarding incomplete. Finish onboarding first.",
    previewHint: "Finish onboarding first.",
  },
} as const;

export function scenarioConfirmMessage(scenario: QaScenario): string {
  return `Applies this preset.\n\n${scenario.summary}\n\nExpected: ${VERDICT_META[scenario.expected].title}.`;
}

export function formatConsentDate(iso: string | null): string | null {
  const date = parseConsentDate(iso);
  if (date === null) return null;
  return date.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatBareValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  return JSON.stringify(value);
}

function resolveBlockedReason(
  featureEnabled: boolean | undefined,
  hasCompletedOnboarding: boolean,
): BlockedReason | null {
  if (!featureEnabled) return "analyticsOptIn flag is off";
  if (!hasCompletedOnboarding) return "onboarding incomplete";
  return null;
}

function buildInspectorFields(
  consentInfo: AnalyticsConsentInfo,
  storedVersion: PolicyVersion | null,
  formattedConsentDate: string | null,
  consentDateState: ConsentDateState,
  currentPolicyVersion: PolicyVersion | null,
  rawPolicyVersion: unknown,
): Readonly<{ storedFields: InspectorField[]; policyVersionField: InspectorField }> {
  let storedPolicyValue: string;
  if (storedVersion) {
    storedPolicyValue = `Version ${storedVersion.major}.${storedVersion.minor}`;
  } else if (consentInfo.privacyPolicyVersion === null) {
    storedPolicyValue = "Missing";
  } else {
    storedPolicyValue = "Invalid";
  }

  let consentDateValue: string;
  if (formattedConsentDate) {
    consentDateValue = formattedConsentDate;
  } else if (consentDateState === "missing") {
    consentDateValue = "Missing";
  } else {
    consentDateValue = "Invalid";
  }

  let consentDateStatus: InspectorField["status"];
  if (consentDateState === "valid") {
    consentDateStatus = { label: "Valid", tone: "success" };
  } else if (consentDateState === "missing") {
    consentDateStatus = { label: "Missing", tone: "error" };
  } else {
    consentDateStatus = { label: "Invalid", tone: "error" };
  }

  return {
    storedFields: [
      {
        label: "Saved policy version",
        value: storedPolicyValue,
        raw: `privacyPolicyVersion: ${formatBareValue(consentInfo.privacyPolicyVersion)}`,
        status: resolveStoredPolicyInspectorStatus(
          consentInfo.privacyPolicyVersion,
          storedVersion,
          currentPolicyVersion,
        ),
      },
      {
        label: "Consent date",
        value: consentDateValue,
        raw: consentInfo.consentDate
          ? `consentDate: ${formatBareValue(consentInfo.consentDate)}`
          : "consentDate: null",
        status: consentDateStatus,
      },
    ],
    policyVersionField: {
      label: "Remote policy version",
      value: currentPolicyVersion
        ? `Version ${currentPolicyVersion.major}.${currentPolicyVersion.minor}`
        : "Invalid — checks off",
      raw: `policyVersion: ${formatBareValue(rawPolicyVersion)}`,
      status: currentPolicyVersion
        ? { label: "Valid", tone: "success" }
        : { label: "Invalid", tone: "error" },
    },
  };
}

export function useAnalyticsConsentOptInQaViewModel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const feature = useFeature(FLAG_KEY);
  const rawPolicyVersion = feature?.params?.policyVersion;

  const consentInfo = useSelector(analyticsConsentInfoSelector);
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const personalizedEnabled = useSelector(sharePersonalizedRecommendationsSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const hasSeenPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const trackingEnabled = useSelector(trackingEnabledSelector);
  const overrides = useSelector(featureFlagsOverridesSelector);
  const hasAnalyticsOptInOverride = overrides[FLAG_KEY] !== undefined;

  const { decision, currentPolicyVersion } = useAnalyticsConsentDecision(consentInfo);
  const storedVersion = parseStoredPolicyVersion(consentInfo.privacyPolicyVersion);
  const consentDateState = getConsentDateState(consentInfo.consentDate);

  const [tab, setTab] = useState<TabId>("scenarios");
  const [isPreviewMounted, setPreviewMounted] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  // Remote policyVersion without a local override — refreshed on mount and after Reset all.
  const [baselinePolicyVersion, setBaselinePolicyVersion] =
    useState<PolicyVersion>(SYNTHETIC_BASELINE);

  useEffect(() => {
    if (!hasAnalyticsOptInOverride) {
      setBaselinePolicyVersion(resolveBaselinePolicyVersion(feature?.params?.policyVersion));
    }
  }, [hasAnalyticsOptInOverride, feature?.params?.policyVersion]);

  const blockedReason = resolveBlockedReason(feature?.enabled, hasCompletedOnboarding);
  const phase = resolveAnalyticsConsentPhase("closed", decision, shareAnalytics);
  const isEligibleForDrawer = blockedReason === null && phase !== "closed";
  const verdict = mapDecisionToQaExpectation(decision, shareAnalytics, blockedReason);
  const verdictMeta = VERDICT_META[verdict];
  const verdictReason = blockedReason ?? decision.reason;
  const blocked = blockedReason !== null ? BLOCKED_META[blockedReason] : null;
  const headline = blocked ? "Blocked — no drawer" : verdictMeta.title;
  const headlineHint = blocked ? blocked.hint : verdictMeta.hint;
  const previewHint = blocked ? blocked.previewHint : verdictMeta.previewHint;

  const isAlreadyReset =
    !hasAnalyticsOptInOverride &&
    consentInfo.consentDate === null &&
    consentInfo.privacyPolicyVersion === null &&
    !shareAnalytics &&
    !personalizedEnabled &&
    !hasSeenPrompt;

  const clearPreview = () => {
    setPreviewMounted(false);
  };

  const overrideConfigVersion = (policyVersion: number | string | undefined) => {
    clearPreview();
    dispatch(
      setOverride({
        key: FLAG_KEY,
        value:
          policyVersion === undefined
            ? undefined
            : {
                ...feature,
                enabled: feature?.enabled ?? true,
                params: { ...feature?.params, policyVersion },
              },
      }),
    );
  };

  const overrideFlagEnabled = (enabled: boolean) => {
    clearPreview();
    dispatch(
      setOverride({
        key: FLAG_KEY,
        value: {
          ...feature,
          enabled,
          params: feature?.params ?? {},
        },
      }),
    );
  };

  const applyScenario = (scenario: QaScenario) => {
    const { policyVersion, storedVersion: nextStoredVersion } = resolveScenarioVersions(
      scenario,
      baselinePolicyVersion,
    );
    overrideConfigVersion(policyVersion);
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: resolveScenarioConsentDate(scenario.consentDate, new Date()),
        // `undefined` from resolveScenarioVersions means leave the saved version as-is.
        privacyPolicyVersion:
          nextStoredVersion === undefined ? consentInfo.privacyPolicyVersion : nextStoredVersion,
      }),
    );
    dispatch(setShareAnalytics(scenario.analyticsEnabled));
    dispatch(setSharePersonalizedRecommendations(scenario.analyticsEnabled));
    dispatch(setHasSeenAnalyticsOptInPrompt(scenario.hasSeenPrompt));
    clearPreview();
  };

  const onResetAll = () => {
    overrideConfigVersion(undefined);
    dispatch(setAnalyticsConsentInfo({ consentDate: null, privacyPolicyVersion: null }));
    dispatch(setShareAnalytics(false));
    dispatch(setSharePersonalizedRecommendations(false));
    dispatch(setHasSeenAnalyticsOptInPrompt(false));
    clearPreview();
  };

  const onPreviewDialog = () => {
    setPreviewKey(key => key + 1);
    setPreviewMounted(true);
  };

  const onBack = () => {
    navigate("/settings/developer");
  };

  const { storedFields, policyVersionField } = buildInspectorFields(
    consentInfo,
    storedVersion,
    formatConsentDate(consentInfo.consentDate),
    consentDateState,
    currentPolicyVersion,
    rawPolicyVersion,
  );

  const toggleFields: ToggleField[] = [
    {
      label: "Analytics enabled",
      value: shareAnalytics,
      onChange: value => {
        clearPreview();
        dispatch(setShareAnalytics(value));
      },
    },
    {
      label: "Personalized recommendations",
      value: personalizedEnabled,
      onChange: value => {
        clearPreview();
        dispatch(setSharePersonalizedRecommendations(value));
      },
    },
    {
      label: "Has seen consent prompt",
      value: hasSeenPrompt,
      note: hasSeenPrompt ? undefined : "Never answered consent prompt",
      onChange: value => {
        clearPreview();
        dispatch(setHasSeenAnalyticsOptInPrompt(value));
      },
    },
  ];

  const scenariosByGroup = SCENARIO_GROUPS.map(expected => ({
    expected,
    meta: VERDICT_META[expected],
    scenarios: QA_SCENARIOS.filter(scenario => scenario.expected === expected),
  }));

  return {
    tab,
    setTab,
    headline,
    headlineHint,
    headlineTone: (blocked ? "warning" : verdictMeta.tone) as FieldTone,
    reasonLabel: REASON_LABEL[verdictReason] ?? verdictReason,
    trackingEnabled,
    trackingPausedUntilAnswered: !trackingEnabled && verdict === "Re-ask",
    isEligibleForDrawer,
    isPreviewMounted,
    previewKey,
    previewHint,
    isAlreadyReset,
    policyVersionField,
    storedFields,
    toggleFields,
    scenariosByGroup,
    overrideFlagEnabled,
    featureEnabled: Boolean(feature?.enabled),
    applyScenario,
    onResetAll,
    onPreviewDialog,
    onBack,
  };
}

export type AnalyticsConsentOptInQaViewModel = ReturnType<
  typeof useAnalyticsConsentOptInQaViewModel
>;

export type { QaExpectation, QaScenario } from "@features/flow-analytics-consent/debug";
