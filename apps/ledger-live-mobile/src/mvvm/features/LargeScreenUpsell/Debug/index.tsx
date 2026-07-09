import React from "react";
import { View, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Banner, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { EditableRow, ReadOnlyRow, SectionCard, StatusRow, ToggleRow } from "./components";
import { useLargeScreenUpsellDebugViewModel } from "./useLargeScreenUpsellDebugViewModel";

function LargeScreenUpsellDebug() {
  const {
    wouldShow,
    isFlagEnabled,
    modalEnabled,
    killThreshold,
    cadenceDays,
    cooldownDaysDefault,
    breakdown,
    onboardingDateValue,
    onboardingDateHint,
    retriesValue,
    retriesHint,
    lastSeenValue,
    lastSeenHint,
    handleToggleFlag,
    handleApplyOnboardingDate,
    handleSetOnboardingDateNull,
    handleApplyRetries,
    handleResetRetries,
    handleApplyLastSeen,
    handleSetLastSeenNull,
  } = useLargeScreenUpsellDebugViewModel();

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Box lx={{ marginBottom: "s16" }}>
          <Banner
            appearance="info"
            title="Large-screen upsell debug"
            description="Change any value below and watch the decision update live. All setters are pre-filled with the current persisted value."
          />
        </Box>

        <SectionCard>
          <Text typography="body3" lx={{ color: "muted", marginBottom: "s4" }}>
            Shows at next app start
          </Text>
          <Text
            typography="heading5SemiBold"
            lx={{ color: wouldShow ? "success" : "error", marginBottom: "s8" }}
          >
            {wouldShow ? "WILL SHOW" : "WON'T SHOW"}
          </Text>
          <Text typography="body3" lx={{ color: "muted" }}>
            The modal shows only when every check below passes.
          </Text>
        </SectionCard>

        <SectionCard title="Decision breakdown" subtitle="Each gate must pass for the modal to show.">
          <StatusRow label="Feature flag enabled" ok={isFlagEnabled} />
          <StatusRow label="Modal enabled (flag)" ok={modalEnabled} />
          <StatusRow label="Audience eligible" ok={breakdown.audienceOk} hint={breakdown.audienceHint} />
          <StatusRow
            label="Cooldown elapsed"
            ok={breakdown.cooldownOk}
            hint={breakdown.cooldownHint}
          />
          <StatusRow
            label="Not throttled"
            ok={breakdown.notThrottledOk}
            hint={breakdown.throttleHint}
          />
        </SectionCard>

        <SectionCard
          title="Feature flag"
          subtitle="Toggle the flag and inspect the values that drive the decision."
        >
          <ToggleRow
            label="largeScreenUpsell"
            value={isFlagEnabled}
            onChange={handleToggleFlag}
            description={isFlagEnabled ? "Enabled. Toggle to disable." : "Disabled. Toggle to enable."}
          />
          <Box lx={{ marginTop: "s8" }}>
            <ReadOnlyRow
              label="killThreshold"
              value={killThreshold != null ? String(killThreshold) : "-"}
            />
            <ReadOnlyRow
              label="cooldownDays (default)"
              value={cooldownDaysDefault != null ? String(cooldownDaysDefault) : "-"}
            />
            <ReadOnlyRow
              label="cadenceDays"
              value={cadenceDays != null ? String(cadenceDays) : "-"}
            />
            <ReadOnlyRow label="modal.enabled" value={String(modalEnabled)} />
          </Box>
        </SectionCard>

        <SectionCard title="Onboarding date" subtitle="Drives the cooldown gate.">
          <EditableRow
            label="onboardingDate"
            initialValue={onboardingDateValue}
            onApply={handleApplyOnboardingDate}
            description={onboardingDateHint}
            placeholder="2026-06-01T00:00:00.000Z or 30"
            actionLabel="Set null (legacy)"
            onAction={handleSetOnboardingDateNull}
          />
        </SectionCard>

        <SectionCard title="Frequency state" subtitle="Drives the throttle gate.">
          <EditableRow
            label="retries (times dismissed)"
            initialValue={retriesValue}
            onApply={handleApplyRetries}
            description={retriesHint}
            placeholder="0"
            keyboardType="number-pad"
            actionLabel="Reset counter"
            onAction={handleResetRetries}
          />
          <EditableRow
            label="lastSeenAt (last shown)"
            initialValue={lastSeenValue}
            onApply={handleApplyLastSeen}
            description={lastSeenHint}
            placeholder="2026-06-01T00:00:00.000Z or 30"
            actionLabel="Set null"
            onAction={handleSetLastSeenNull}
          />
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});

export default LargeScreenUpsellDebug;
