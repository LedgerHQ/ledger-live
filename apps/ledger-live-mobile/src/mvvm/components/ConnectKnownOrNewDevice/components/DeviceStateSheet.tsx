import React from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  Button,
} from "@ledgerhq/lumen-ui-rnative";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  type ConnectKnownOrNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  TrackedConnectingState,
  TrackedWaitingForSelectedDeviceState,
} from "LLM/components/DeviceConnection";
import {
  DeviceIntentTrackingProvider,
  useDeviceIntentTracking,
} from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import { trackConnectDeviceButtonClicked } from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { useTranslation } from "~/context/Locale";
import { assertNever } from "../utils/assertNever";
import type { ConnectKnownOrNewDeviceViewProps } from "../types";
import { DEVICE_LIST_BUTTON } from "../utils/tracking";

export type DeviceStateSheetState = Extract<
  ConnectKnownOrNewDeviceUIState,
  {
    type:
      | typeof ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice
      | typeof ConnectKnownOrNewDeviceUIStateTypes.Connecting;
  }
>;

type DeviceStateSheetProps = {
  /** The waiting or connecting state, or `null` when the sheet is closed. */
  state: DeviceStateSheetState | null;
  checkIsNewDevice: ConnectKnownOrNewDeviceViewProps["checkIsNewDevice"];
  /** Called on every close, also when `state` leaves the sheet. */
  onClose: () => void;
};

function WaitingHint({ onAddNewDevice }: Readonly<{ onAddNewDevice?: () => void }>) {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  const onPress = onAddNewDevice
    ? () => {
        trackConnectDeviceButtonClicked({
          sourceFlow,
          button: DEVICE_LIST_BUTTON.AddDevice,
          extraProperties: analyticsProperties,
        });
        onAddNewDevice();
      }
    : undefined;

  return (
    <Banner
      appearance="info"
      title={t("connectKnownOrNewDevice.waitingHint.title")}
      primaryAction={
        <Button
          appearance="gray"
          size="sm"
          disabled={!onPress}
          onPress={onPress}
          lx={{ flexShrink: 1 }}
        >
          {t("connectKnownOrNewDevice.addDevice")}
        </Button>
      }
    />
  );
}

function DeviceStateContent({
  state,
  checkIsNewDevice,
}: Readonly<{
  state: DeviceStateSheetState;
  checkIsNewDevice: ConnectKnownOrNewDeviceViewProps["checkIsNewDevice"];
}>): React.ReactNode {
  switch (state.type) {
    case ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice:
      return (
        <>
          <TrackedWaitingForSelectedDeviceState device={state.device} />
          {state.showDeviceNotFound && <WaitingHint onAddNewDevice={state.addNewDevice} />}
        </>
      );
    case ConnectKnownOrNewDeviceUIStateTypes.Connecting:
      return (
        <TrackedConnectingState
          device={state.device}
          isNewDevice={checkIsNewDevice(state.device)}
        />
      );
    default:
      return assertNever(state);
  }
}

export function DeviceStateSheet({
  state,
  checkIsNewDevice,
  onClose,
}: Readonly<DeviceStateSheetProps>): React.JSX.Element {
  const trackingContext = useDeviceIntentTracking();
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  // Lumen's static preset can force Android dynamic sheets full height, so use the live window cap.
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={state !== null}
      onClose={onClose}
      enableDynamicSizing
      maxDynamicContentSize={maxDynamicContentSize}
      contentHasBottomSpace
      testID="connect-known-or-new-device-state-sheet"
    >
      <BottomSheetScrollView
        style={{ paddingBottom: 0 }}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <BottomSheetHeader />
        {/* The sheet renders its content through a portal, outside the provider of the component. */}
        <DeviceIntentTrackingProvider value={trackingContext}>
          <Box lx={{ gap: "s16" }}>
            {state && <DeviceStateContent state={state} checkIsNewDevice={checkIsNewDevice} />}
          </Box>
        </DeviceIntentTrackingProvider>
      </BottomSheetScrollView>
    </QueuedBottomSheet>
  );
}
