import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box, Button, NavBar, NavBarBackButton, Text } from "@ledgerhq/lumen-ui-rnative";
import {
  CloseConfirmation,
  OsUpdateStep,
  WhatsNewScreen,
} from "@features/flow-device-os-update/native";
import { type OsUpdateStepProps } from "@features/platform-device-os-update";
import { progressPresets, updateCounts } from "./fixtures";
import type { Preview } from "./previews";
import type { OsUpdateGalleryViewModel } from "./useOsUpdateGalleryViewModel";

export function OsUpdateGalleryView(viewModel: Readonly<OsUpdateGalleryViewModel>) {
  const { preview, previewKey } = viewModel;

  if (preview) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]} key={previewKey}>
        <PreviewContent {...viewModel} preview={preview} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <NavBar density="compact">
        <NavBarBackButton onPress={viewModel.onBack} accessibilityLabel="Back" />
      </NavBar>
      <ScrollView contentContainerStyle={styles.list}>
        <Box lx={{ gap: "s24", padding: "s16" }}>
          <Box lx={{ gap: "s16" }}>
            <Choices
              title="Device"
              options={viewModel.models.map(({ modelId, label }) => ({ value: modelId, label }))}
              selected={viewModel.modelId}
              onSelect={viewModel.onSelectModel}
            />
            <Choices
              title="OS updates"
              options={updateCounts.map(count => ({
                value: count,
                label: count === 1 ? "1 update" : `${count} updates`,
              }))}
              selected={viewModel.updateCount}
              onSelect={viewModel.onSelectUpdateCount}
            />
            <Choices
              title="Progress"
              options={progressPresets.map(progress => ({
                value: progress,
                label: `${Math.round(progress * 100)}%`,
              }))}
              selected={viewModel.progress}
              onSelect={viewModel.onSelectProgress}
            />
          </Box>
          {viewModel.previewGroups.map(group => (
            <Choices
              key={group.title}
              title={group.title}
              options={group.previews.map(groupPreview => ({
                value: groupPreview,
                label: groupPreview.label,
              }))}
              onSelect={viewModel.onSelectPreview}
            />
          ))}
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}

function PreviewContent({
  preview,
  step,
  whatsNewProps,
  onClosePreview,
}: Readonly<OsUpdateGalleryViewModel & { preview: Preview }>) {
  switch (preview.kind) {
    case "step":
      return step ? (
        <>
          <SeededOsUpdateStep props={step.props} backgroundProps={step.backgroundProps} />
          <CloseConfirmation
            isOpen={step.isCloseConfirmationOpen}
            onContinue={onClosePreview}
            onCancel={onClosePreview}
          />
        </>
      ) : null;
    case "whatsNew":
      return <WhatsNewScreen {...whatsNewProps} />;
    default: {
      const unhandled: never = preview;
      return unhandled;
    }
  }
}

/**
 * Shows the progress state the orchestrator reports before the previewed one for a single render,
 * so the screen behind a sheet keeps a filled bar and the success screen gets its finishing animation.
 */
function SeededOsUpdateStep({
  props,
  backgroundProps,
}: Readonly<{ props: OsUpdateStepProps; backgroundProps: OsUpdateStepProps | undefined }>) {
  const [isSeeded, setIsSeeded] = useState(backgroundProps === undefined);
  useEffect(() => setIsSeeded(true), []);

  return <OsUpdateStep {...(isSeeded || !backgroundProps ? props : backgroundProps)} />;
}

function Choices<T>({
  title,
  options,
  selected,
  onSelect,
}: Readonly<{
  title: string;
  options: readonly Readonly<{ value: T; label: string }>[];
  selected?: T;
  onSelect: (value: T) => void;
}>) {
  return (
    <Box lx={{ gap: "s8" }}>
      <Text typography="body2SemiBold" lx={{ color: "base" }}>
        {title}
      </Text>
      <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
        {options.map(({ value, label }) => (
          <Button
            key={label}
            size="sm"
            appearance={value === selected ? "base" : "gray"}
            onPress={() => onSelect(value)}
          >
            {label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingBottom: 32 },
});
