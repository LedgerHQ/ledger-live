import React, { useState } from "react";
import { Alert, TouchableOpacity } from "react-native";
import {
  Box,
  Button,
  Divider,
  SegmentedControl,
  SegmentedControlButton,
  Tag,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { NotificationPromptTarget } from "LLM/features/NotificationsPrompt";
import { NotificationsPromptDrawerView } from "LLM/features/NotificationsPrompt/screens/NotificationsPromptDrawerView";
import { QaInspectorRow } from "LLM/components/QaInspectorRow";
import QueuedDrawer from "~/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { useNotificationsPromptQaViewModel } from "./useNotificationsPromptQaViewModel";
import {
  NOTIFICATIONS_QA_GROUPS,
  NOTIFICATIONS_QA_SCENARIOS,
  NOTIFICATIONS_QA_VERDICT_META,
  SOURCE_LABEL,
  TRIGGER_SOURCES,
  type NotificationsQaInspectorField,
  type NotificationsQaScenario,
} from "./utils";

type TabId = "scenarios" | "inspect";

function confirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}

function ScenariosTab({
  selectedSource,
  forceOpenDrawerLabel,
  onSelectSource,
  onApplyScenario,
  onTriggerProductionDrawer,
  onForceOpenDrawer,
  onMarkInactive,
  onMarkRepromptable,
  onKeepTwoDismissals,
}: Readonly<{
  selectedSource: ReturnType<typeof useNotificationsPromptQaViewModel>["selectedSource"];
  forceOpenDrawerLabel: string;
  onSelectSource: ReturnType<typeof useNotificationsPromptQaViewModel>["setSelectedSource"];
  onApplyScenario: (scenario: NotificationsQaScenario) => void;
  onTriggerProductionDrawer: () => void;
  onForceOpenDrawer: () => void;
  onMarkInactive: () => void;
  onMarkRepromptable: () => void;
  onKeepTwoDismissals: () => void;
}>) {
  return (
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
                      () => onApplyScenario(scenario),
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
            onPress={() => onSelectSource(source)}
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
          {forceOpenDrawerLabel}
        </Button>
        <Text typography="body3" lx={{ color: "muted" }}>
          The production trigger uses the real engine and configured delay. Force open bypasses
          eligibility and runs the real drawer handlers.
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
  );
}

function InspectTab({
  userStateFields,
  decisionFields,
  featureFields,
}: Readonly<{
  userStateFields: NotificationsQaInspectorField[];
  decisionFields: NotificationsQaInspectorField[];
  featureFields: NotificationsQaInspectorField[];
}>) {
  return (
    <Box>
      <Text typography="body3SemiBold" lx={{ color: "muted", marginBottom: "s4" }}>
        Current user and device state
      </Text>
      {userStateFields.map(field => (
        <QaInspectorRow key={field.label} field={field} />
      ))}

      <Text
        typography="body3SemiBold"
        lx={{ color: "muted", marginTop: "s16", marginBottom: "s4" }}
      >
        Production decision
      </Text>
      {decisionFields.map(field => (
        <QaInspectorRow key={field.label} field={field} />
      ))}

      <Text
        typography="body3SemiBold"
        lx={{ color: "muted", marginTop: "s16", marginBottom: "s4" }}
      >
        Feature configuration
      </Text>
      {featureFields.map(field => (
        <QaInspectorRow key={field.label} field={field} />
      ))}
    </Box>
  );
}

export default function DebugNotificationsPromptQA() {
  const {
    selectedSource,
    setSelectedSource,
    isBaselineCaptured,
    verdict,
    verdictMeta,
    reason,
    rawReason,
    resolvedPromptTarget,
    forceOpenDrawerLabel,
    decision,
    sourceLabel,
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
  } = useNotificationsPromptQaViewModel();
  const [tab, setTab] = useState<TabId>("scenarios");
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [previewTarget, setPreviewTarget] =
    useState<NotificationPromptTarget>("globalPushNotifications");

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
                  {sourceLabel} · {resolvedPromptTarget}
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
              <Button
                appearance="accent"
                size="sm"
                onPress={() => {
                  setPreviewTarget(resolvedPromptTarget);
                  setPreviewOpen(true);
                }}
              >
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
            <ScenariosTab
              selectedSource={selectedSource}
              forceOpenDrawerLabel={forceOpenDrawerLabel}
              onSelectSource={setSelectedSource}
              onApplyScenario={applyScenario}
              onTriggerProductionDrawer={() => {
                setPreviewOpen(false);
                onTriggerProductionDrawer();
              }}
              onForceOpenDrawer={() => {
                setPreviewOpen(false);
                onForceOpenDrawer();
              }}
              onMarkInactive={onMarkInactive}
              onMarkRepromptable={onMarkRepromptable}
              onKeepTwoDismissals={onKeepTwoDismissals}
            />
          ) : (
            <InspectTab
              userStateFields={userStateFields}
              decisionFields={decisionFields}
              featureFields={featureFields}
            />
          )}
        </Box>
      </SettingsNavigationScrollView>
    </Box>
  );
}
