import React, { useEffect, useState } from "react";
import { Alert, TouchableOpacity } from "react-native";
import {
  Box,
  Button,
  Divider,
  SegmentedControl,
  SegmentedControlButton,
  Switch,
  Tag,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
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
} from "@features/flow-analytics-consent";
import {
  mapDecisionToQaExpectation,
  QA_SCENARIOS,
  REASON_LABEL,
  resolveBaselinePolicyVersion,
  resolveScenarioConsentDate,
  resolveScenarioVersions,
  SCENARIO_GROUPS,
  SYNTHETIC_BASELINE,
  VERDICT_META,
  type QaExpectation,
  type QaScenario,
} from "@features/flow-analytics-consent/debug";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  analyticsConsentInfoSelector,
  analyticsEnabledSelector,
  hasCompletedOnboardingSelector,
  hasSeenAnalyticsOptInPromptSelector,
  personalizedRecommendationsEnabledSelector,
  trackingEnabledSelector,
} from "~/reducers/settings";
import {
  setAnalytics,
  setAnalyticsConsentInfo,
  setHasSeenAnalyticsOptInPrompt,
  setPersonalizedRecommendations,
} from "~/actions/settings";
import { AnalyticsConsentDrawer } from "LLM/features/AnalyticsConsentDrawer";
import NavigationScrollView from "~/components/NavigationScrollView";
import { TrackScreen } from "~/analytics";

const FLAG_KEY = "analyticsOptIn";

type TabId = "scenarios" | "inspect";

type FieldTone = "success" | "error" | "warning" | "gray";

type InspectorField = {
  label: string;
  /** Large primary value the tester should read first. */
  value: string;
  /** Small secondary line, typically the raw stored form. */
  raw?: string;
  /** Tag shown next to the label: Valid, Invalid, Missing, On, Off… */
  status: { label: string; tone: FieldTone };
};

type ToggleField = {
  label: string;
  value: boolean;
  note?: string;
  onChange: (v: boolean) => void;
};

type StoredConsentInfo = Readonly<AnalyticsConsentInfo>;

type BlockedReason = keyof typeof BLOCKED_META;

const BLOCKED_META: Record<string, { hint: string; previewHint: string }> = {
  "analyticsOptIn flag is off": {
    hint: "Feature flag off. Turn on Feature flag enabled in Inspect.",
    previewHint: "Enable feature flag in Inspect first.",
  },
  "onboarding incomplete": {
    hint: "Onboarding incomplete. Finish onboarding first.",
    previewHint: "Finish onboarding first.",
  },
};

function confirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}

function scenarioConfirmMessage(scenario: QaScenario): string {
  return `Applies this preset.\n\n${scenario.summary}\n\nExpected: ${VERDICT_META[scenario.expected].title}.`;
}

function formatConsentDate(iso: string | null): string | null {
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

function formatBareValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  return JSON.stringify(value);
}

function buildInspectorFields(
  consentInfo: StoredConsentInfo,
  storedVersion: PolicyVersion | null,
  formattedConsentDate: string | null,
  consentDateState: ReturnType<typeof getConsentDateState>,
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

  let storedPolicyStatus: InspectorField["status"];
  if (consentInfo.privacyPolicyVersion === null) {
    storedPolicyStatus = { label: "Missing", tone: "error" };
  } else if (storedVersion) {
    storedPolicyStatus = { label: "Valid", tone: "success" };
  } else {
    storedPolicyStatus = { label: "Invalid", tone: "error" };
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
        status: storedPolicyStatus,
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

function ToggleRow({ field }: Readonly<{ field: ToggleField }>) {
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
        <Tag
          label={field.value ? "On" : "Off"}
          size="sm"
          appearance={field.value ? "success" : "gray"}
        />
      </Box>
      <Box lx={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      </Box>
      {field.note ? (
        <Text typography="body3" lx={{ color: "warning" }}>
          {field.note}
        </Text>
      ) : null}
    </Box>
  );
}

function GroupLabel({
  expectation,
  first,
}: Readonly<{ expectation: QaExpectation; first?: boolean }>) {
  const meta = VERDICT_META[expectation];
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        gap: "s8",
        marginTop: first ? undefined : "s16",
        marginBottom: "s8",
      }}
    >
      <Tag label={meta.title} size="sm" appearance={meta.tone} />
      <Text typography="body3" lx={{ color: "muted", flex: 1 }}>
        {meta.hint}
      </Text>
    </Box>
  );
}

function QaTabSection({
  tab,
  onTabChange,
  isAlreadyReset,
  onResetAll,
  onApplyScenario,
  storedFields,
  policyVersionField,
  toggleFields,
  featureEnabled,
  onFlagEnabledChange,
}: Readonly<{
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  isAlreadyReset: boolean;
  onResetAll: () => void;
  onApplyScenario: (scenario: QaScenario) => void;
  storedFields: InspectorField[];
  policyVersionField: InspectorField;
  toggleFields: ToggleField[];
  featureEnabled: boolean;
  onFlagEnabledChange: (enabled: boolean) => void;
}>) {
  return (
    <Box lx={{ gap: "s8" }}>
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
        <Box lx={{ flex: 1 }}>
          <SegmentedControl
            selectedValue={tab}
            onSelectedChange={onTabChange}
            tabLayout="fit"
            accessibilityLabel="Analytics consent QA sections"
          >
            <SegmentedControlButton value="scenarios">Scenarios</SegmentedControlButton>
            <SegmentedControlButton value="inspect">Inspect</SegmentedControlButton>
          </SegmentedControl>
        </Box>
        <Button
          appearance="no-background"
          size="sm"
          disabled={isAlreadyReset}
          onPress={() =>
            confirm(
              "Reset all",
              "Clears saved consent and analytics preferences, and removes the local test override.",
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
          {SCENARIO_GROUPS.map((expected: QaExpectation, index: number) => {
            const meta = VERDICT_META[expected];
            return (
              <Box key={expected}>
                <GroupLabel expectation={expected} first={index === 0} />
                <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
                  {QA_SCENARIOS.filter(
                    (scenario: QaScenario) => scenario.expected === expected,
                  ).map((scenario: QaScenario) => (
                    <TouchableOpacity
                      key={scenario.id}
                      activeOpacity={0.7}
                      style={{ flexBasis: "47%", flexGrow: 1 }}
                      onPress={() =>
                        confirm(scenario.name, scenarioConfirmMessage(scenario), "Apply", () =>
                          onApplyScenario(scenario),
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
                        <Tag label={meta.title} size="sm" appearance={meta.tone} />
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
        </Box>
      ) : (
        <Box>
          <Text typography="body3SemiBold" lx={{ color: "muted", marginBottom: "s4" }}>
            Stored on this device
          </Text>
          {storedFields.map(field => (
            <InspectorRow key={field.label} field={field} />
          ))}
          <Text
            typography="body3SemiBold"
            lx={{ color: "muted", marginTop: "s16", marginBottom: "s4" }}
          >
            From remote config
          </Text>
          <ToggleRow
            field={{
              label: "Feature flag enabled",
              value: featureEnabled,
              onChange: onFlagEnabledChange,
            }}
          />
          <InspectorRow field={policyVersionField} />
          <Text
            typography="body3SemiBold"
            lx={{ color: "muted", marginTop: "s16", marginBottom: "s4" }}
          >
            User preferences
          </Text>
          {toggleFields.map(field => (
            <ToggleRow key={field.label} field={field} />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function DebugAnalyticsConsentQA() {
  const dispatch = useDispatch();
  const feature = useFeature(FLAG_KEY);
  const rawPolicyVersion = feature?.params?.policyVersion;

  const consentInfo = useSelector(analyticsConsentInfoSelector);
  const analyticsEnabled = useSelector(analyticsEnabledSelector);
  const personalizedEnabled = useSelector(personalizedRecommendationsEnabledSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const hasSeenPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const trackingEnabled = useSelector(trackingEnabledSelector);
  const hasAnalyticsOptInOverride = useSelector(
    state => state.featureFlags.overrides[FLAG_KEY] !== undefined,
  );

  const { decision, currentPolicyVersion } = useAnalyticsConsentDecision(consentInfo);
  const storedVersion = parseStoredPolicyVersion(consentInfo.privacyPolicyVersion);
  const consentDateState = getConsentDateState(consentInfo.consentDate);

  const [tab, setTab] = useState<TabId>("scenarios");
  // Remote policyVersion without a local override — refreshed on mount and after Reset all.
  const [baselinePolicyVersion, setBaselinePolicyVersion] =
    useState<PolicyVersion>(SYNTHETIC_BASELINE);
  // Remounting the drawer is what re-opens it, since it closes itself by setting its own phase.
  const [previewKey, setPreviewKey] = useState(0);
  // Kept mounted only until the next state change: a mounted drawer re-opens itself on every
  // decision change, which would pop it over the screen each time a scenario is applied.
  const [isPreviewMounted, setPreviewMounted] = useState(false);

  useEffect(() => {
    if (!hasAnalyticsOptInOverride) {
      setBaselinePolicyVersion(resolveBaselinePolicyVersion(feature?.params?.policyVersion));
    }
  }, [hasAnalyticsOptInOverride, feature?.params?.policyVersion]);

  let blockedReason: BlockedReason | null = null;
  if (!feature?.enabled) blockedReason = "analyticsOptIn flag is off";
  else if (!hasCompletedOnboarding) blockedReason = "onboarding incomplete";

  const phase = resolveAnalyticsConsentPhase("closed", decision, analyticsEnabled);
  const isEligibleForDrawer = blockedReason === null && phase !== "closed";
  const verdict = mapDecisionToQaExpectation(decision, analyticsEnabled, blockedReason);
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
    !analyticsEnabled &&
    !personalizedEnabled &&
    !hasSeenPrompt;

  const overrideConfigVersion = (policyVersion: number | string | undefined) => {
    setPreviewMounted(false);
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
    setPreviewMounted(false);
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
    const { policyVersion, storedVersion } = resolveScenarioVersions(
      scenario,
      baselinePolicyVersion,
    );
    overrideConfigVersion(policyVersion);
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: resolveScenarioConsentDate(scenario.consentDate, new Date()),
        // `undefined` from resolveScenarioVersions means leave the saved version as-is.
        privacyPolicyVersion:
          storedVersion === undefined ? consentInfo.privacyPolicyVersion : storedVersion,
      }),
    );
    dispatch(setAnalytics(scenario.analyticsEnabled));
    dispatch(setPersonalizedRecommendations(scenario.analyticsEnabled));
    dispatch(setHasSeenAnalyticsOptInPrompt(scenario.hasSeenPrompt));
    setPreviewMounted(false);
  };

  const onResetAll = () => {
    overrideConfigVersion(undefined);
    dispatch(setAnalyticsConsentInfo({ consentDate: null, privacyPolicyVersion: null }));
    dispatch(setAnalytics(false));
    dispatch(setPersonalizedRecommendations(false));
    dispatch(setHasSeenAnalyticsOptInPrompt(false));
    setPreviewMounted(false);
  };

  const onPreviewDrawer = () => {
    setPreviewKey(key => key + 1);
    setPreviewMounted(true);
  };

  const formattedConsentDate = formatConsentDate(consentInfo.consentDate);
  const { storedFields, policyVersionField } = buildInspectorFields(
    consentInfo,
    storedVersion,
    formattedConsentDate,
    consentDateState,
    currentPolicyVersion,
    rawPolicyVersion,
  );

  const toggleFields: ToggleField[] = [
    {
      label: "Analytics enabled",
      value: analyticsEnabled,
      onChange: value => {
        setPreviewMounted(false);
        dispatch(setAnalytics(value));
      },
    },
    {
      label: "Personalized recommendations",
      value: personalizedEnabled,
      onChange: value => {
        setPreviewMounted(false);
        dispatch(setPersonalizedRecommendations(value));
      },
    },
    {
      label: "Has seen consent prompt",
      value: hasSeenPrompt,
      note: hasSeenPrompt ? undefined : "Never answered consent prompt",
      onChange: value => {
        setPreviewMounted(false);
        dispatch(setHasSeenAnalyticsOptInPrompt(value));
      },
    },
  ];

  return (
    <Box lx={{ flex: 1 }}>
      <TrackScreen category="Settings" name="DebugAnalyticsConsentQA" />
      {isPreviewMounted ? <AnalyticsConsentDrawer key={previewKey} /> : null}
      <NavigationScrollView
        key={tab}
        contentContainerStyle={{ paddingBottom: 64 }}
        style={{ flex: 1 }}
      >
        <Box lx={{ paddingHorizontal: "s24", paddingBottom: "s24", paddingTop: "s16", gap: "s16" }}>
          <Box lx={{ backgroundColor: "muted", borderRadius: "md", padding: "s16", gap: "s12" }}>
            <Box lx={{ gap: "s4" }}>
              <Text
                typography="heading3SemiBold"
                lx={{ color: blockedReason !== null ? "warning" : verdictMeta.tone }}
              >
                {headline}
              </Text>
              <Text typography="body3" lx={{ color: "muted" }}>
                {headlineHint}
              </Text>
            </Box>

            <Box lx={{ gap: "s8" }}>
              <Box lx={{ gap: "s2" }}>
                <Text typography="body3" lx={{ color: "muted" }}>
                  Reason
                </Text>
                <Text typography="body2SemiBold" lx={{ color: "base" }}>
                  {REASON_LABEL[verdictReason] ?? verdictReason}
                </Text>
              </Box>
              <Box lx={{ gap: "s2" }}>
                <Text typography="body3" lx={{ color: "muted" }}>
                  Analytics tracking
                </Text>
                <Text
                  typography="body2SemiBold"
                  lx={{ color: trackingEnabled ? "success" : "error" }}
                >
                  {trackingEnabled ? "On" : "Off"}
                  {!trackingEnabled && verdict === "Re-ask" ? " · paused until answered" : ""}
                </Text>
              </Box>
            </Box>

            <Divider />

            <Box lx={{ gap: "s8" }}>
              <Button
                appearance="accent"
                size="sm"
                disabled={!isEligibleForDrawer}
                onPress={onPreviewDrawer}
              >
                Preview drawer
              </Button>
              <Text typography="body3" lx={{ color: "muted" }}>
                {previewHint}
              </Text>
            </Box>
          </Box>

          <QaTabSection
            tab={tab}
            onTabChange={setTab}
            isAlreadyReset={isAlreadyReset}
            onResetAll={onResetAll}
            onApplyScenario={applyScenario}
            storedFields={storedFields}
            policyVersionField={policyVersionField}
            toggleFields={toggleFields}
            featureEnabled={Boolean(feature?.enabled)}
            onFlagEnabledChange={overrideFlagEnabled}
          />
        </Box>
      </NavigationScrollView>
    </Box>
  );
}
