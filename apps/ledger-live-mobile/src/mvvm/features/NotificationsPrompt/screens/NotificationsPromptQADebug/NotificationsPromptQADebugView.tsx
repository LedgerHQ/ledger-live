import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  Banner,
  Box,
  Button,
  Card,
  Divider,
  SegmentedControl,
  SegmentedControlButton,
  Switch,
  Tag,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { TrackScreen } from "~/analytics";
import type {
  NotificationsPromptQADebugViewModel,
  PromptTargetVerdict,
  TransactionsAlertsOverview,
} from "./useNotificationsPromptQADebugViewModel";
import type { RepromptTiming } from "../../utils/notificationsPromptDebug";

const PERMISSION_LABEL: Record<
  (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus],
  string
> = {
  [AuthorizationStatus.AUTHORIZED]: "Authorized",
  [AuthorizationStatus.DENIED]: "Denied",
  [AuthorizationStatus.NOT_DETERMINED]: "Not determined",
  [AuthorizationStatus.PROVISIONAL]: "Provisional",
  [AuthorizationStatus.EPHEMERAL]: "Ephemeral",
};

// AuthorizationStatus.DENIED is 0 (falsy), so a plain `permissionStatus && ...` truthy check
// would silently skip the label for that status — check against null/undefined explicitly.
const getPermissionLabel = (
  permissionStatus:
    | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
    | null
    | undefined,
): string => (permissionStatus != null ? PERMISSION_LABEL[permissionStatus] : "Unknown");

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Box lx={{ marginBottom: "s8" }}>
    <Text typography="body2SemiBold" lx={{ color: "muted", marginBottom: "s8" }}>
      {children}
    </Text>
    <Divider />
  </Box>
);

const TraceRow = ({ label, status }: { label: string; status: "pass" | "fail" | "pending" }) => (
  <Box lx={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: "s8" }}>
    <Text
      typography="body2SemiBold"
      lx={{
        marginRight: "s8",
        color: status === "pass" ? "success" : status === "fail" ? "error" : "muted",
      }}
    >
      {status === "pass" ? "✓" : status === "fail" ? "✗" : "○"}
    </Text>
    <Text typography="body3" lx={{ color: status === "pending" ? "muted" : "base", flexShrink: 1 }}>
      {label}
    </Text>
  </Box>
);

/**
 * Lightweight dismissal → cooldown → eligible-again timeline, built from Lumen primitives only.
 * Kept prominent (own section, not just a caption) so the exact WHEN is never just an abstract
 * banner: the absolute eligible-at instant is always spelled out next to the bar.
 */
const CooldownTimeline = ({ timing, now }: { timing: RepromptTiming; now: number }) => {
  if (timing.startAt === null || timing.eligibleAt === null) {
    return (
      <Text typography="body3" lx={{ color: "muted", marginBottom: "s16" }}>
        Cooldown: {timing.remaining}
      </Text>
    );
  }

  const total = timing.eligibleAt - timing.startAt;
  const pct = total > 0 ? Math.min(1, Math.max(0, (now - timing.startAt) / total)) : 1;
  const eligibleAtLabel = new Date(timing.eligibleAt).toLocaleString();

  return (
    <Box lx={{ marginBottom: "s16" }}>
      <Box
        lx={{ height: "s8", borderRadius: "full", backgroundColor: "muted", overflow: "hidden" }}
      >
        <Box
          lx={{
            height: "s8",
            borderRadius: "full",
            backgroundColor: timing.state === "eligible" ? "successStrong" : "active",
          }}
          style={{ width: `${pct * 100}%` }}
        />
      </Box>
      <Box lx={{ flexDirection: "row", justifyContent: "space-between", marginTop: "s4" }}>
        <Text typography="body4" lx={{ color: "muted" }}>
          Dismissed
        </Text>
        <Text typography="body4" lx={{ color: "muted" }}>
          Eligible again
        </Text>
      </Box>
      <Text typography="body3SemiBold" lx={{ color: "base", marginTop: "s8" }}>
        Cooldown: {timing.remaining}
      </Text>
      <Text typography="body4" lx={{ color: "muted" }}>
        Eligible at {eligibleAtLabel}
      </Text>
    </Box>
  );
};

const PromptTargetRow = ({ verdict }: { verdict: PromptTargetVerdict }) => (
  <Box lx={{ paddingVertical: "s12" }}>
    <Box lx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Box lx={{ flexDirection: "row", alignItems: "center", columnGap: "s8", flexShrink: 1 }}>
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          {verdict.label}
        </Text>
        {verdict.isLive ? (
          <Tag appearance="accent" size="sm" label="LIVE NOW" />
        ) : (
          <Tag appearance="gray" size="sm" label="hypothetical" />
        )}
      </Box>
      <Tag
        appearance={verdict.wouldShow ? "success" : "gray"}
        size="sm"
        label={verdict.wouldShow ? "Would show" : "Blocked"}
      />
    </Box>
    {verdict.reasonLabel && (
      <Text typography="body3" lx={{ color: "muted", marginTop: "s4" }}>
        {verdict.reasonLabel}
      </Text>
    )}
  </Box>
);

/**
 * "Transaction alerts" row for the "After an action" tab. Deliberately NOT re-evaluated per
 * selected source (that was confusing — see NotificationsPromptQADebug follow-up feedback):
 * only the gates that don't depend on the source are shown at the top, and the per-action
 * breakdown below is a static list against the real configured `drawerPromptActions`, so it
 * doesn't shuffle around as the source selector changes.
 */
const TransactionsAlertsBreakdown = ({ overview }: { overview: TransactionsAlertsOverview }) => (
  <Box lx={{ paddingVertical: "s12" }}>
    <Box lx={{ flexDirection: "row", alignItems: "center", columnGap: "s8", marginBottom: "s4" }}>
      <Text typography="body2SemiBold" lx={{ color: "base" }}>
        Transaction alerts
      </Text>
      {overview.isLive ? (
        <Tag appearance="accent" size="sm" label="LIVE NOW" />
      ) : (
        <Tag appearance="gray" size="sm" label="hypothetical" />
      )}
    </Box>
    {overview.blockedReason && (
      <Text typography="body3" lx={{ color: "muted", marginBottom: "s8" }}>
        {overview.blockedReason}
      </Text>
    )}
    <Text typography="body3" lx={{ color: "muted", marginBottom: "s8" }}>
      Per action, against the real configured drawerPromptActions (remote config, not hardcoded) —
      doesn't change with the source selector above:
    </Text>
    <Box lx={{ paddingLeft: "s16" }}>
      {overview.perSourceEligibility.map(({ value, label, eligible }) => (
        <Box
          key={value}
          lx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: "s4",
          }}
        >
          <Text typography="body3" lx={{ color: "base" }}>
            {label}
          </Text>
          <Tag
            appearance={eligible ? "success" : "gray"}
            size="sm"
            label={eligible ? "Eligible" : "Not eligible"}
          />
        </Box>
      ))}
    </Box>
  </Box>
);

type DecisionSectionProps = Pick<
  NotificationsPromptQADebugViewModel,
  | "hero"
  | "timing"
  | "now"
  | "trace"
  | "canTriggerViaProductionRules"
  | "triggerViaProductionRulesDisabledReason"
  | "triggerViaProductionRulesLabel"
  | "triggerViaProductionRules"
  | "forceOpenDrawer"
>;

/** Shared by the "After an action" and "After inactivity" tabs: hero, timeline, trace, live actions. */
const DecisionSection = ({
  hero,
  timing,
  now,
  trace,
  canTriggerViaProductionRules,
  triggerViaProductionRulesDisabledReason,
  triggerViaProductionRulesLabel,
  triggerViaProductionRules,
  forceOpenDrawer,
}: DecisionSectionProps) => (
  <>
    <Banner
      appearance={hero.appearance}
      title={hero.title}
      description={hero.description}
      lx={{ marginBottom: "s8" }}
    />
    <CooldownTimeline timing={timing} now={now} />

    <SectionLabel>WHY</SectionLabel>
    <Card type="info">
      <Box lx={{ paddingHorizontal: "s16", paddingVertical: "s8" }}>
        {trace.map(step => (
          <TraceRow key={step.id} label={step.label} status={step.status} />
        ))}
      </Box>
    </Card>

    <Box lx={{ marginTop: "s24" }}>
      <SectionLabel>SEE IT LIVE</SectionLabel>
      <Button
        appearance="accent"
        onPress={triggerViaProductionRules}
        disabled={!canTriggerViaProductionRules}
        lx={{ marginBottom: "s8" }}
      >
        {triggerViaProductionRulesLabel}
      </Button>
      <Text typography="body3" lx={{ color: "muted", marginBottom: "s16" }}>
        {canTriggerViaProductionRules
          ? "Runs the real eligibility check and emits real analytics."
          : `Disabled — ${triggerViaProductionRulesDisabledReason}`}
      </Text>

      <Box lx={{ flexDirection: "row", columnGap: "s8", marginBottom: "s8" }}>
        <Box lx={{ flex: 1 }}>
          <Button
            appearance="no-background"
            onPress={() => forceOpenDrawer("globalPushNotifications")}
          >
            Force open — global push
          </Button>
        </Box>
        <Box lx={{ flex: 1 }}>
          <Button
            appearance="no-background"
            onPress={() => forceOpenDrawer("transactionsAlertsCategory")}
          >
            Force open — tx alerts
          </Button>
        </Box>
      </Box>
      <Text typography="body3" lx={{ color: "muted", marginBottom: "s24" }}>
        Bypasses every check — no analytics. Use to preview copy for either target.
      </Text>
    </Box>
  </>
);

const StatusRow = ({
  label,
  value,
  valueAppearance,
  onEdit,
  editLabel = "Edit",
}: {
  label: string;
  value: string;
  valueAppearance: "success" | "gray";
  onEdit: () => void;
  editLabel?: string;
}) => (
  <Box
    lx={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: "s12",
    }}
  >
    <Box lx={{ flexShrink: 1, paddingRight: "s12" }}>
      <Text typography="body2" lx={{ color: "base", marginBottom: "s4" }}>
        {label}
      </Text>
      <Tag appearance={valueAppearance} size="sm" label={value} />
    </Box>
    <Button size="sm" appearance="no-background" onPress={onEdit}>
      {editLabel}
    </Button>
  </Box>
);

export function NotificationsPromptQADebugView({
  activeTab,
  setActiveTab,
  mode,
  sources,
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
  isFeatureEnabled,
  isOverridden,
  selectedActionEventEnabled,
  transactionsAlertsConfiguredForSelectedSource,
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
}: NotificationsPromptQADebugViewModel) {
  const decisionSectionProps: DecisionSectionProps = {
    hero,
    timing,
    now,
    trace,
    canTriggerViaProductionRules,
    triggerViaProductionRulesDisabledReason,
    triggerViaProductionRulesLabel,
    triggerViaProductionRules,
    forceOpenDrawer,
  };
  const selectedSourceLabel =
    sources.find(source => source.value === selectedSource)?.label ?? selectedSource;

  return (
    <Box lx={{ flex: 1 }}>
      <TrackScreen category="Settings" name="DebugNotificationsPromptQA" />
      {/* Fixed header (not part of the ScrollView): stays on screen while the tab content below
          scrolls, so the tab switcher and — on "After an action" — the source picker/"Go verify"
          link never require scrolling back up to reach. */}
      <Box lx={{ paddingHorizontal: "s24", paddingTop: "s16" }}>
        <SegmentedControl
          selectedValue={activeTab}
          onSelectedChange={setActiveTab}
          accessibilityLabel="QA debug tab"
          lx={{ marginBottom: "s16" }}
        >
          <SegmentedControlButton value="action">After an action</SegmentedControlButton>
          <SegmentedControlButton value="inactivity">After inactivity</SegmentedControlButton>
          <SegmentedControlButton value="config">Config & status</SegmentedControlButton>
        </SegmentedControl>

        <Box
          lx={{
            flexDirection: "row",
            flexWrap: "wrap",
            columnGap: "s8",
            rowGap: "s8",
            marginBottom: "s16",
          }}
        >
          <Tag
            appearance={isFeatureEnabled ? "success" : "error"}
            size="sm"
            label={`Feature ${isFeatureEnabled ? "ON" : "OFF"}`}
          />
          {isOverridden && <Tag appearance="warning" size="sm" label="OVERRIDDEN" />}
          <Tag appearance="gray" size="sm" label={`OS: ${getPermissionLabel(permissionStatus)}`} />
          <Tag
            appearance={notifications.areNotificationsAllowed ? "success" : "gray"}
            size="sm"
            label={`Global push ${notifications.areNotificationsAllowed ? "ON" : "OFF"}`}
          />
          <Tag
            appearance={notifications.transactionsAlertsCategory ? "success" : "gray"}
            size="sm"
            label={`Tx alerts ${notifications.transactionsAlertsCategory ? "ON" : "OFF"}`}
          />
        </Box>

        {activeTab === "action" && (
          <Box lx={{ marginBottom: "s16" }}>
            <Box lx={{ flexDirection: "row", flexWrap: "wrap", columnGap: "s8", rowGap: "s8" }}>
              {sources.map(source => (
                <Button
                  key={source.value}
                  size="sm"
                  appearance={selectedSource === source.value ? "accent" : "no-background"}
                  onPress={() => setSelectedSource(source.value)}
                >
                  {source.label}
                </Button>
              ))}
            </Box>
            {goVerify && (
              <Button
                size="sm"
                appearance="no-background"
                onPress={goVerify}
                lx={{ marginTop: "s8" }}
              >
                Go verify → open the real {selectedSourceLabel} flow
              </Button>
            )}
          </Box>
        )}
      </Box>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Box lx={{ paddingHorizontal: "s24", paddingBottom: "s16" }}>
          {activeTab === "action" && (
            <>
              <DecisionSection {...decisionSectionProps} />

              <SectionLabel>PROMPT TARGETS FOR "{selectedSourceLabel}"</SectionLabel>
              <Text typography="body3" lx={{ color: "muted", marginBottom: "s8" }}>
                An action routes to exactly one of these, never both. Global push opt-in depends on
                the selected source above; transaction alerts below is a static, source-independent
                view of the real config.
              </Text>
              <Card type="info">
                <Box lx={{ paddingHorizontal: "s16" }}>
                  <PromptTargetRow verdict={globalPushVerdict} />
                  <Divider />
                  <TransactionsAlertsBreakdown overview={transactionsAlertsOverview} />
                </Box>
              </Card>
            </>
          )}

          {activeTab === "inactivity" && <DecisionSection {...decisionSectionProps} />}

          {activeTab === "config" && (
            <>
              <SectionLabel>CHANGE CONFIGS — remote flag (brazePushNotifications)</SectionLabel>
              <Card type="info">
                <Box lx={{ paddingHorizontal: "s16" }}>
                  <Box
                    lx={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: "s12",
                    }}
                  >
                    <Text typography="body2" lx={{ color: "base" }}>
                      Feature enabled
                    </Text>
                    <Switch checked={isFeatureEnabled} onCheckedChange={toggleFeatureEnabled} />
                  </Box>
                  <Divider />
                  <Box
                    lx={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: "s12",
                    }}
                  >
                    <Text
                      typography="body2"
                      lx={{ color: "base", flexShrink: 1, paddingRight: "s12" }}
                    >
                      action_events[{selectedSource}].enabled
                    </Text>
                    <Switch
                      checked={selectedActionEventEnabled}
                      onCheckedChange={toggleActionEventForSelectedSource}
                    />
                  </Box>
                  <Divider />
                  <Box
                    lx={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: "s12",
                    }}
                  >
                    <Text
                      typography="body2"
                      lx={{ color: "base", flexShrink: 1, paddingRight: "s12" }}
                    >
                      Transaction alerts prompt for {selectedSource}
                    </Text>
                    <Switch
                      checked={transactionsAlertsConfiguredForSelectedSource}
                      onCheckedChange={toggleTransactionsAlertsPromptForSelectedSource}
                    />
                  </Box>
                  <Divider />
                  <Box lx={{ flexDirection: "row", columnGap: "s8", paddingVertical: "s12" }}>
                    <Box lx={{ flex: 1 }}>
                      <Button size="sm" appearance="accent" onPress={applyFastQaConfig}>
                        Apply Fast QA mode (5s)
                      </Button>
                    </Box>
                    <Box lx={{ flex: 1 }}>
                      <Button
                        size="sm"
                        appearance="gray"
                        onPress={restoreRemoteConfig}
                        disabled={!isOverridden}
                      >
                        Restore remote config
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Card>

              <SectionLabel>USER STATUS</SectionLabel>
              <Card type="info">
                <Box lx={{ paddingHorizontal: "s16" }}>
                  <StatusRow
                    label="OS permission status"
                    value={getPermissionLabel(permissionStatus)}
                    valueAppearance={
                      permissionStatus === AuthorizationStatus.AUTHORIZED ? "success" : "gray"
                    }
                    onEdit={openOsSettings}
                    editLabel="Open OS settings"
                  />
                  <Divider />
                  <StatusRow
                    label="App notifications allowed"
                    value={notifications.areNotificationsAllowed ? "ON" : "OFF"}
                    valueAppearance={notifications.areNotificationsAllowed ? "success" : "gray"}
                    onEdit={navigateToNotificationsSettings}
                  />
                  <Divider />
                  <StatusRow
                    label="Transaction alerts"
                    value={notifications.transactionsAlertsCategory ? "ON" : "OFF"}
                    valueAppearance={notifications.transactionsAlertsCategory ? "success" : "gray"}
                    onEdit={navigateToNotificationsSettings}
                  />
                  <Divider />
                  <Box lx={{ paddingVertical: "s12" }}>
                    <Button
                      size="sm"
                      appearance="accent"
                      onPress={simulateFullOptIn}
                      lx={{ marginBottom: "s8" }}
                    >
                      Opt in for real (Braze + identify)
                    </Button>
                    <Button
                      size="sm"
                      appearance="gray"
                      onPress={recordDismissalNow}
                      lx={{ marginBottom: "s8" }}
                    >
                      Record a dismissal now
                    </Button>
                    <Button
                      size="sm"
                      appearance="gray"
                      onPress={makeEligibleNow}
                      lx={{ marginBottom: "s8" }}
                    >
                      {mode === "action"
                        ? "Make eligible now (skip cooldown)"
                        : "Make eligible now (backdate last action)"}
                    </Button>
                    <Button
                      size="sm"
                      appearance="gray"
                      onPress={truncateDismissals}
                      lx={{ marginBottom: "s8" }}
                    >
                      Truncate dismissal history to 1
                    </Button>
                    <Button size="sm" appearance="red" onPress={resetAllQaState}>
                      Reset all QA state
                    </Button>
                  </Box>
                </Box>
              </Card>

              {dismissalHistory.length > 0 && (
                <Box lx={{ marginTop: "s24" }}>
                  <SectionLabel>DISMISSAL HISTORY ({dismissalHistory.length})</SectionLabel>
                  <Card type="info">
                    <Box lx={{ paddingHorizontal: "s16" }}>
                      {dismissalHistory.map(({ timestamp, formatted }, index) => (
                        <Box key={timestamp}>
                          <Box lx={{ paddingVertical: "s8" }}>
                            <Text typography="body3" lx={{ color: "base" }}>
                              {formatted?.local ?? `invalid (${timestamp})`}
                            </Text>
                          </Box>
                          {index < dismissalHistory.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </Box>
                  </Card>
                </Box>
              )}
            </>
          )}
        </Box>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});
