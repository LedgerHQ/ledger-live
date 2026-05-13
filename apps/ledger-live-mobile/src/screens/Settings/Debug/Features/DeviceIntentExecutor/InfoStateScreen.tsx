import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Search } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { InfoState } from "LLM/components/InfoState";
import type { InfoStatePreset, InfoStateProps } from "LLM/components/InfoState/types";

const presetOptions: InfoStatePreset[] = ["illustration", "spot", "success", "error", "info", "text"];
const sizeOptions: Array<NonNullable<InfoStateProps["size"]>> = ["full-height", "hug"];

export default function DebugInfoStateScreen() {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [preset, setPreset] = useState<InfoStatePreset>("success");
  const [size, setSize] = useState<NonNullable<InfoStateProps["size"]>>("full-height");
  const [showTitle, setShowTitle] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [showPrimaryCta, setShowPrimaryCta] = useState(true);
  const [showSecondaryCta, setShowSecondaryCta] = useState(true);
  const [useLongTitle, setUseLongTitle] = useState(false);
  const [useLongDescription, setUseLongDescription] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const title = useLongTitle ? longTitle : `${formatPresetLabel(preset)} state title`;
  const description = useLongDescription
    ? longDescription
    : "Use this component for focused feedback and next-step guidance.";

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Box lx={{ gap: "s8", marginBottom: "s24" }}>
          <Text typography="body2" lx={{ color: "muted" }}>
            Local playground for the reusable mobile info-state component.
          </Text>
        </Box>

        <Box lx={cardStyle}>
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            Playground controls
          </Text>

          <SettingSection title="Preset">
            {presetOptions.map(presetOption => (
              <ChoiceButton
                key={presetOption}
                label={formatPresetLabel(presetOption)}
                selected={presetOption === preset}
                onPress={() => setPreset(presetOption)}
              />
            ))}
          </SettingSection>

          <SettingSection title="Size">
            {sizeOptions.map(sizeOption => (
              <ChoiceButton
                key={sizeOption}
                label={sizeOption}
                selected={sizeOption === size}
                onPress={() => setSize(sizeOption)}
              />
            ))}
          </SettingSection>

          <SettingSection title="Visibility">
            <ToggleButton
              label="Title"
              enabled={showTitle}
              onPress={() => setShowTitle(value => !value)}
            />
            <ToggleButton
              label="Description"
              enabled={showDescription}
              onPress={() => setShowDescription(value => !value)}
            />
            <ToggleButton
              label="Banner"
              enabled={showBanner}
              onPress={() => setShowBanner(value => !value)}
            />
            <ToggleButton
              label="Primary CTA"
              enabled={showPrimaryCta}
              onPress={() => setShowPrimaryCta(value => !value)}
            />
            <ToggleButton
              label="Secondary CTA"
              enabled={showSecondaryCta}
              onPress={() => setShowSecondaryCta(value => !value)}
            />
          </SettingSection>

          <SettingSection title="Copy stress">
            <ToggleButton
              label="Long title"
              enabled={useLongTitle}
              onPress={() => setUseLongTitle(value => !value)}
            />
            <ToggleButton
              label="Long description"
              enabled={useLongDescription}
              onPress={() => setUseLongDescription(value => !value)}
            />
          </SettingSection>

          <Button
            appearance="base"
            size="lg"
            onPress={() => setIsPreviewOpen(true)}
            testID="info-state-open-preview"
          >
            Open preview
          </Button>
        </Box>
      </ScrollView>

      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        enableDynamicSizing
        testID="info-state-preview-sheet"
      >
        <BottomSheetView style={[styles.sheetContent, { paddingBottom: bottomInset + 24 }]}>
          <BottomSheetHeader />
          {renderInfoStatePreview({
            preset,
            size,
            title: showTitle ? title : undefined,
            description: showDescription ? description : undefined,
            banner: showBanner
              ? {
                  title: "Important information",
                  description: "This optional banner sits before the action stack.",
                  appearance: "info",
                }
              : undefined,
            primaryCta: showPrimaryCta
              ? {
                  label: "Primary action",
                  onPress: () => undefined,
                  testID: "info-state-primary-cta",
                }
              : undefined,
            secondaryCta: showSecondaryCta
              ? {
                  label: "Secondary action",
                  onPress: () => undefined,
                  testID: "info-state-secondary-cta",
                }
              : undefined,
          })}
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    </>
  );
}

function renderInfoStatePreview({
  preset,
  ...commonProps
}: Readonly<
  Pick<
    InfoStateProps,
    "banner" | "description" | "primaryCta" | "secondaryCta" | "size" | "title"
  > & {
    preset: InfoStatePreset;
  }
>) {
  switch (preset) {
    case "illustration":
      return (
        <InfoState
          {...commonProps}
          preset="illustration"
          illustration={<Box lx={illustrationPlaceholderStyle} />}
          testID="info-state-preview"
        />
      );
    case "spot":
      return (
        <InfoState
          {...commonProps}
          preset="spot"
          spotProps={{ icon: Search }}
          testID="info-state-preview"
        />
      );
    case "success":
      return <InfoState {...commonProps} preset="success" testID="info-state-preview" />;
    case "error":
      return <InfoState {...commonProps} preset="error" testID="info-state-preview" />;
    case "info":
      return <InfoState {...commonProps} preset="info" testID="info-state-preview" />;
    case "text":
      return <InfoState {...commonProps} preset="text" testID="info-state-preview" />;
    default:
      return assertNever(preset);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled info state preset: ${value}`);
}

function SettingSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <Box lx={{ gap: "s8" }}>
      <Text typography="body2" lx={{ color: "muted" }}>
        {title}
      </Text>
      <Box lx={controlsRowStyle}>{children}</Box>
    </Box>
  );
}

function ChoiceButton({
  label,
  selected,
  onPress,
}: Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
}>) {
  return (
    <Button appearance={selected ? "base" : "gray"} size="sm" onPress={onPress}>
      {label}
    </Button>
  );
}

function ToggleButton({
  label,
  enabled,
  onPress,
}: Readonly<{
  label: string;
  enabled: boolean;
  onPress: () => void;
}>) {
  return (
    <Button appearance={enabled ? "base" : "gray"} size="sm" onPress={onPress}>
      {label}: {enabled ? "On" : "Off"}
    </Button>
  );
}

function formatPresetLabel(preset: InfoStatePreset): string {
  return preset.charAt(0).toUpperCase() + preset.slice(1);
}

const cardStyle = {
  backgroundColor: "surface",
  borderRadius: "md",
  gap: "s16",
  padding: "s16",
  width: "full",
} as const;

const controlsRowStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "s8",
} as const;

const illustrationPlaceholderStyle = {
  backgroundColor: "muted",
  borderRadius: "sm",
  height: "full",
  width: "full",
} as const;

const longTitle =
  "A longer title that validates the centered heading behavior when the info state is used in compact mobile surfaces";

const longDescription =
  "This longer description intentionally spans several lines on narrow mobile screens. It helps validate the body copy line height, centered alignment, vertical rhythm, and the transition into banners and actions.";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sheetContent: {
    paddingHorizontal: 16,
  },
});
