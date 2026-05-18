import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import {
  DeviceActionContent,
  type DeviceActionAnimationTheme,
  type DeviceActionContentAction,
  type SupportedDeviceActionModelId,
  supportedDeviceActionModelIds,
} from "LLM/components/DeviceActionContent";
import { getProductName } from "LLM/utils/getProductName";

const actionLabels: Record<DeviceActionContentAction, string> = {
  continue: "Continue",
  "power-and-unlock": "Power and unlock",
};

const actionOptions: DeviceActionContentAction[] = ["continue", "power-and-unlock"];
const themeOptions: Array<DeviceActionAnimationTheme | undefined> = [undefined, "light", "dark"];

const deviceNames: Record<SupportedDeviceActionModelId, string> = {
  [DeviceModelId.nanoS]: "Ledger Nano S CDA1",
  [DeviceModelId.nanoSP]: "Ledger Nano S Plus CDA1",
  [DeviceModelId.nanoX]: "Ledger Nano X CDA1",
  [DeviceModelId.stax]: "Ledger Stax CDA1",
  [DeviceModelId.europa]: "Ledger Flex CDA1",
  [DeviceModelId.apex]: "Ledger Apex CDA1",
};

export default function DebugDeviceActionContentScreen() {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [modelId, setModelId] = useState<SupportedDeviceActionModelId>(DeviceModelId.europa);
  const [action, setAction] = useState<DeviceActionContentAction>("continue");
  const [showTitle, setShowTitle] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showDeviceName, setShowDeviceName] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const [useLongTitle, setUseLongTitle] = useState(false);
  const [useLongDescription, setUseLongDescription] = useState(false);
  const [themeOverride, setThemeOverride] = useState<DeviceActionAnimationTheme | undefined>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const productName = getProductName(modelId);
  const title = useLongTitle ? longTitle : `${actionLabels[action]} your ${productName}`;
  const description = useLongDescription
    ? longDescription
    : "Keep Ledger Live open while you complete the action on your Ledger device.";

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Box lx={{ gap: "s8", marginBottom: "s24" }}>
          <Text typography="body2" lx={{ color: "muted" }}>
            Local playground for the reusable mobile device-action-content component.
          </Text>
        </Box>

        <Box lx={cardStyle}>
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            Playground controls
          </Text>

          <SettingSection title="Device model">
            {supportedDeviceActionModelIds.map(deviceModelId => (
              <ChoiceButton
                key={deviceModelId}
                label={getProductName(deviceModelId)}
                selected={deviceModelId === modelId}
                onPress={() => setModelId(deviceModelId)}
              />
            ))}
          </SettingSection>

          <SettingSection title="Action">
            {actionOptions.map(actionOption => (
              <ChoiceButton
                key={actionOption}
                label={actionLabels[actionOption]}
                selected={actionOption === action}
                onPress={() => setAction(actionOption)}
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
              label="Device tag"
              enabled={showDeviceName}
              onPress={() => setShowDeviceName(value => !value)}
            />
            <ToggleButton
              label="Banner"
              enabled={showBanner}
              onPress={() => setShowBanner(value => !value)}
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

          <SettingSection title="Theme">
            {themeOptions.map(themeOption => (
              <ChoiceButton
                key={themeOption ?? "current"}
                label={themeOption ? themeOption : "Current app theme"}
                selected={themeOption === themeOverride}
                onPress={() => setThemeOverride(themeOption)}
              />
            ))}
          </SettingSection>

          <Button
            appearance="base"
            size="lg"
            onPress={() => setIsPreviewOpen(true)}
            testID="device-action-content-open-preview"
          >
            Open preview
          </Button>
        </Box>
      </ScrollView>

      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        enableDynamicSizing
        testID="device-action-content-preview-sheet"
      >
        <BottomSheetView style={[styles.sheetContent, { paddingBottom: bottomInset + 24 }]}>
          <BottomSheetHeader />
          <DeviceActionContent
            title={showTitle ? title : undefined}
            description={showDescription ? description : undefined}
            deviceName={showDeviceName ? deviceNames[modelId] : undefined}
            deviceModelId={modelId}
            action={action}
            theme={themeOverride}
            banner={
              showBanner
                ? {
                    title: useLongTitle
                      ? "A long banner title that checks wrapping near the bottom of the content"
                      : "Make sure the device stays connected",
                    description: useLongDescription
                      ? "This banner copy is intentionally verbose so the Lumen Banner can be checked alongside the centered device copy."
                      : "Do not disconnect the cable or close the app during this step.",
                    appearance: action === "continue" ? "info" : "warning",
                  }
                : undefined
            }
            testID="device-action-content-preview"
          />
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    </>
  );
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

const longTitle =
  "Continue on your Ledger device and carefully review every instruction before approving this unusually long action title";

const longDescription =
  "This description intentionally spans multiple lines on small screens. It helps validate centered body copy, spacing between the title and description, and the transition into the banner without clipping or overlapping content.";

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
