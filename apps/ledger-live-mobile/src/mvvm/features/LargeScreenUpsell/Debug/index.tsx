import React from "react";
import { View, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Banner, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { LargeScreenUpsellModalDrawer } from "../components/LargeScreenUpsellModalDrawer";
import { EditableRow, ReadOnlyRow, SectionCard, StatusRow, ToggleRow } from "./components";
import { useLargeScreenUpsellDebugViewModel } from "./useLargeScreenUpsellDebugViewModel";

function LargeScreenUpsellDebug() {
  const {
    wouldShow,
    isFlagEnabled,
    modalEnabled,
    discountValue,
    killThresholdValue,
    cadenceDaysValue,
    cooldownDaysDefaultValue,
    resolvedCooldownDaysValue,
    handleToggleModalEnabled,
    handleApplyKillThreshold,
    handleApplyCadenceDays,
    handleApplyCooldownDays,
    handleApplyDiscount,
    breakdown,
    onboardingDateValue,
    onboardingDateHint,
    retriesValue,
    retriesHint,
    lastSeenValue,
    lastSeenHint,
    handleToggleFlag,
    isNanoSeen,
    nanoSeenHint,
    handleToggleNanoSeen,
    handleApplyOnboardingDate,
    handleSetOnboardingDateNull,
    handleApplyRetries,
    handleResetRetries,
    handleApplyLastSeen,
    handleSetLastSeenNull,
    isPreviewOpen,
    isPreviewOptedIn,
    previewVariantHint,
    canPreview,
    previewViewModel,
    previewBottomInset,
    handleOpenPreview,
    handleClosePreview,
    handleTogglePreviewVariant,
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

        <SectionCard
          title="Preview modal"
          subtitle="Force the modal open now, bypassing eligibility and throttling, to preview both copy variants."
        >
          <ToggleRow
            label="Opted-in copy variant"
            value={isPreviewOptedIn}
            onChange={handleTogglePreviewVariant}
            description={previewVariantHint}
          />
          <Box lx={{ marginTop: "s8" }}>
            <Button
              size="md"
              appearance="base"
              isFull
              disabled={!canPreview}
              onPress={handleOpenPreview}
            >
              Show modal now
            </Button>
          </Box>
        </SectionCard>

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

        <SectionCard
          title="Decision breakdown"
          subtitle="Each gate must pass for the modal to show."
        >
          <StatusRow label="Feature flag enabled" ok={isFlagEnabled} />
          <StatusRow label="Modal enabled (flag)" ok={modalEnabled} />
          <StatusRow
            label="Audience eligible"
            ok={breakdown.audienceOk}
            hint={breakdown.audienceHint}
          />
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
          <StatusRow
            label="No competing app-start modal"
            ok={breakdown.noCompetingModalOk}
            hint={breakdown.competingModalHint}
          />
        </SectionCard>

        <SectionCard
          title="Feature flag"
          subtitle="Toggle the flag and edit the params that drive the decision (local override)."
        >
          <ToggleRow
            label="largeScreenUpsell"
            value={isFlagEnabled}
            onChange={handleToggleFlag}
            description={
              isFlagEnabled ? "Enabled. Toggle to disable." : "Disabled. Toggle to enable."
            }
          />
          <ToggleRow
            label="modal.enabled"
            value={modalEnabled}
            onChange={handleToggleModalEnabled}
            description="Master switch for the modal inside the flag params."
          />
          <Box lx={{ marginTop: "s8" }}>
            <EditableRow
              label="modal.killThreshold"
              initialValue={killThresholdValue}
              onApply={handleApplyKillThreshold}
              description="Dismissals before throttling kicks in."
              placeholder="3"
              keyboardType="number-pad"
            />
            <EditableRow
              label="modal.cadenceDays"
              initialValue={cadenceDaysValue}
              onApply={handleApplyCadenceDays}
              description="Length of the throttle window, in days."
              placeholder="30"
              keyboardType="number-pad"
            />
            <EditableRow
              label="cooldownDays.default"
              initialValue={cooldownDaysDefaultValue}
              onApply={handleApplyCooldownDays}
              description="Days after onboarding before the modal becomes eligible."
              placeholder="30"
              keyboardType="number-pad"
            />
            <EditableRow
              label="discount"
              initialValue={discountValue}
              onApply={handleApplyDiscount}
              description="Discount ratio shown in the copy (0 to 1)."
              placeholder="0.2"
              keyboardType="decimal-pad"
            />
            <ReadOnlyRow label="cooldownDays (resolved)" value={resolvedCooldownDaysValue} />
          </Box>
        </SectionCard>

        <SectionCard title="Device audience" subtitle="Drives the audience gate.">
          <ToggleRow
            label="Nano seen"
            value={isNanoSeen}
            onChange={handleToggleNanoSeen}
            description={nanoSeenHint}
          />
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

      {previewViewModel ? (
        <LargeScreenUpsellModalDrawer
          isOpen={isPreviewOpen}
          onDismiss={handleClosePreview}
          featureIntroViewModel={previewViewModel}
          bottomInset={previewBottomInset}
        />
      ) : null}
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
