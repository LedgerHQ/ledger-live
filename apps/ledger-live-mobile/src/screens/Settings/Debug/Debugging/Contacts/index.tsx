import React, { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Box, Divider } from "@ledgerhq/lumen-ui-rnative";
import { useContactsDevToolViewModel } from "./useContactsDevToolViewModel";
import {
  ContactsDevToolHeader,
  ContactsEnabledToggle,
  ContactsSampleDataSection,
  EligibleAddressFamiliesSection,
  FeatureFlagPreview,
  FeatureParamRow,
  SectionHeader,
} from "./components";

export default function DebugContacts() {
  const {
    featureFlag,
    isEnabled,
    newBadge,
    eligibleAddressFamilies,
    hasDismissedFeatureIntroduction,
    handleToggleEnabled,
    handleToggleNewBadge,
    handleToggleFeatureIntroductionDismissed,
    handleSetEligibleAddressFamilies,
    handleRestoreDefaults,
    handleLoadSamples,
    handleLoadFromSendHistory,
    handleClearContacts,
  } = useContactsDevToolViewModel();

  const featureFlagSummary = useMemo(
    () =>
      JSON.stringify(
        {
          enabled: featureFlag?.enabled ?? false,
          params: featureFlag?.params ?? null,
        },
        null,
        2,
      ),
    [featureFlag?.enabled, featureFlag?.params],
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Box lx={{ paddingHorizontal: "s24", paddingVertical: "s16" }}>
        <ContactsDevToolHeader onRestoreDefaults={handleRestoreDefaults} />
        <ContactsEnabledToggle isEnabled={isEnabled} onToggle={handleToggleEnabled} />

        <ContactsSampleDataSection
          onLoadSamples={handleLoadSamples}
          onLoadFromSendHistory={handleLoadFromSendHistory}
          onClearContacts={handleClearContacts}
        />

        <SectionHeader title="FEATURE PARAMETERS" />

        <Box
          lx={{
            backgroundColor: "surface",
            borderRadius: "md",
            padding: "s8",
            marginBottom: "s24",
          }}
        >
          <FeatureParamRow
            label="New badge"
            isFeatureEnabled={isEnabled}
            value={newBadge}
            onToggle={handleToggleNewBadge}
            testID="debug-contacts-new-badge-switch"
          />

          <Divider />

          <EligibleAddressFamiliesSection
            isEnabled={isEnabled}
            families={eligibleAddressFamilies}
            onPresetSelect={handleSetEligibleAddressFamilies}
          />
        </Box>

        <SectionHeader title="FEATURE INTRODUCTION" />

        <Box
          lx={{
            backgroundColor: "surface",
            borderRadius: "md",
            padding: "s8",
            marginBottom: "s24",
          }}
        >
          <FeatureParamRow
            label="Show introduction"
            isFeatureEnabled
            value={!hasDismissedFeatureIntroduction}
            onToggle={handleToggleFeatureIntroductionDismissed}
            testID="debug-contacts-feature-introduction-switch"
          />
        </Box>

        <FeatureFlagPreview summary={featureFlagSummary} />
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});
