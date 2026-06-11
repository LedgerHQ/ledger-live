import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  AppInteractionRequiredStateType,
  BlockingStateType,
  DeviceInteractionRequiredType,
  FinalStateType,
  LoadingStateType,
  RetryableStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { DeviceContextInitializerComponentLWMView } from "LLM/components/DeviceIntentExecutor/DeviceContextInitializerComponentLWM/DeviceContextInitializerComponentLWMView";
import type { InitializerDevice } from "LLM/components/DeviceIntentExecutor/DeviceContextInitializerComponentLWM/types";

type InitializerStateScenario = Readonly<{
  label: string;
  description: string;
  state: EnsureAppReadyState;
}>;

const noop = () => undefined;

const mockDevice: InitializerDevice = {
  id: "debug-device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: getDeviceModel(DeviceModelId.europa).productName,
  wired: false,
};

const mockError = Object.assign(new Error("Debug initialization failure"), {
  name: "WebPTXPlayerNetworkFail",
});

const scenarios: InitializerStateScenario[] = [
  {
    label: "loading",
    description: "Initial generic waiting state.",
    state: { type: LoadingStateType.Loading },
  },
  {
    label: "installing-app",
    description: "Installing a required app on the device.",
    state: { type: LoadingStateType.InstallingApp },
  },
  {
    label: "unlock-device",
    description: "The device is connected but locked.",
    state: { type: DeviceInteractionRequiredType.UnlockDevice },
  },
  {
    label: "allow-secure-connection",
    description: "A secure connection approval is pending on device.",
    state: { type: DeviceInteractionRequiredType.AllowSecureConnection },
  },
  {
    label: "confirm-open-app",
    description: "The user must confirm opening the requested app.",
    state: { type: DeviceInteractionRequiredType.ConfirmOpenApp },
  },
  {
    label: "device-deprecated-non-blocking",
    description: "Legacy non-blocking deprecation warning flow.",
    state: {
      type: AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking,
      decision: {
        status: "show",
        currencyName: "Bitcoin",
        deviceModelId: DeviceModelId.nanoS,
        supportEndDate: new Date("2026-12-31T00:00:00.000Z"),
        screenSequence: ["warning", "clearSigning"],
      },
      onContinue: noop,
    },
  },
  {
    label: "outdated-app-warning",
    description: "Legacy warning for an outdated app that can still continue.",
    state: {
      type: AppInteractionRequiredStateType.OutdatedAppWarning,
      appName: "Bitcoin",
      onContinue: noop,
    },
  },
  {
    label: "retryable-device-locked",
    description: "A retryable device-locked error after initialization started.",
    state: {
      type: RetryableStateType.DeviceLocked,
      retry: noop,
    },
  },
  {
    label: "retryable-user-refused-on-device",
    description: "The user rejected a device prompt.",
    state: {
      type: RetryableStateType.UserRefusedOnDevice,
      retry: noop,
    },
  },
  {
    label: "retryable-device-busy",
    description: "A prior device prompt is blocking the flow.",
    state: {
      type: RetryableStateType.DeviceBusy,
      retry: noop,
    },
  },
  {
    label: "blocking-device-not-onboarded",
    description: "The connected device has not been set up.",
    state: { type: BlockingStateType.DeviceNotOnboarded },
  },
  {
    label: "blocking-unsupported-firmware-version",
    description: "Ledger OS must be updated before continuing.",
    state: {
      type: BlockingStateType.UnsupportedFirmwareVersion,
      updateInfo: {
        currentVersion: "2.0.0",
        latestVersion: "2.2.0",
      },
    },
  },
  {
    label: "blocking-unsupported-application",
    description: "The app is unavailable for this configuration.",
    state: {
      type: BlockingStateType.UnsupportedApplication,
      appName: "Ethereum",
      deviceModelId: DeviceModelId.nanoS,
    },
  },
  {
    label: "blocking-unsupported-feature",
    description: "The requested feature is unavailable.",
    state: {
      type: BlockingStateType.UnsupportedFeature,
      deviceModelId: DeviceModelId.europa,
    },
  },
  {
    label: "blocking-device-deprecated-blocking",
    description: "Legacy blocking deprecation flow.",
    state: {
      type: BlockingStateType.DeviceDeprecatedBlocking,
      decision: {
        status: "block",
        currencyName: "Bitcoin",
        deviceModelId: DeviceModelId.nanoS,
        supportEndDate: new Date("2026-12-31T00:00:00.000Z"),
      },
    },
  },
  {
    label: "blocking-wrong-device-for-account",
    description: "The selected account belongs to another recovery phrase.",
    state: {
      type: BlockingStateType.WrongDeviceForAccount,
      accountName: "Ethereum 1",
    },
  },
  {
    label: "blocking-device-out-of-storage-space",
    description: "Required apps cannot be installed because storage is full.",
    state: {
      type: BlockingStateType.DeviceOutOfStorageSpace,
      appNames: ["Ethereum", "1inch"],
    },
  },
  {
    label: "error",
    description: "Fallback terminal error state.",
    state: {
      type: FinalStateType.Error,
      error: mockError,
    },
  },
  {
    label: "success",
    description: "Terminal success state. The production executor immediately continues.",
    state: {
      type: FinalStateType.Success,
      extractedContext: {
        currentOsVersion: "2.2.0",
        osUpdateAvailable: false,
        currentAppName: "Ethereum",
        currentAppVersion: "1.12.0",
        derivedAddress: "0x0000000000000000000000000000000000000000",
      },
    },
  },
];

export default function DebugInitializerStatesScreen() {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [selectedScenario, setSelectedScenario] = useState<InitializerStateScenario | null>(null);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Box lx={{ gap: "s8", marginBottom: "s24" }}>
          <Text typography="body2" lx={{ color: "muted" }}>
            Preview every UI state emitted by the Device Intent Executor initializer.
          </Text>
        </Box>

        <Box lx={{ gap: "s12" }}>
          {scenarios.map(scenario => (
            <Box key={scenario.label} lx={cardStyle}>
              <Text typography="body2SemiBold" lx={{ color: "base" }}>
                {scenario.label}
              </Text>
              <Text typography="body2" lx={{ color: "muted" }}>
                {scenario.description}
              </Text>
              <Button
                appearance="base"
                size="lg"
                onPress={() => setSelectedScenario(scenario)}
                testID={`device-initializer-open-${scenario.label}`}
              >
                Open preview
              </Button>
            </Box>
          ))}
        </Box>
      </ScrollView>

      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={Boolean(selectedScenario)}
        onClose={() => setSelectedScenario(null)}
        enableDynamicSizing
        enableHandlePanningGesture={false}
        enablePanDownToClose={false}
        testID="device-initializer-preview-sheet"
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 16 }}>
          <BottomSheetHeader density="compact" />
          {selectedScenario ? (
            <DeviceContextInitializerComponentLWMView
              state={selectedScenario.state}
              device={mockDevice}
              sourceFlow="debug"
              onCancel={() => setSelectedScenario(null)}
            />
          ) : null}
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    </>
  );
}

const cardStyle = {
  backgroundColor: "surface",
  borderRadius: "sm",
  gap: "s12",
  padding: "s16",
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
