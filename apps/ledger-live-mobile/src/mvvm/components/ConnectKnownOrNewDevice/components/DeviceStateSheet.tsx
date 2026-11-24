import React, { useEffect, useRef } from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  Button,
} from "@ledgerhq/lumen-ui-rnative";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  rnHidTransportIdentifier,
  type ConnectKnownOrNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  TrackedConnectingState,
  TrackedWaitingForSelectedDeviceState,
  useIsNewDevice,
} from "LLM/components/DeviceConnection";
import {
  DeviceIntentTrackingProvider,
  useDeviceIntentTracking,
} from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  trackConnectDeviceButtonClicked,
  trackDeviceConnecting,
  trackDeviceflowCanceled,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { useTranslation } from "~/context/Locale";
import { assertNever } from "../utils/assertNever";
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

/**
 * Sends `device_connecting` when it mounts: the connecting content mounts it at each new connection,
 * retries included. Rendered after the page of that content, so the event carries that page.
 */
function DeviceConnectingEvent({
  device,
}: Readonly<{ device: DeviceStateSheetState["device"] }>): null {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const isNewDevice = useIsNewDevice();
  const sendEventRef = useRef(() =>
    trackDeviceConnecting({
      sourceFlow,
      modelId: device.deviceModelId,
      transport: device.transport === rnHidTransportIdentifier ? "usb" : "ble",
      extraProperties: { ...analyticsProperties, isNewDevice: isNewDevice(device) },
    }),
  );

  useEffect(() => {
    sendEventRef.current();
  }, []);

  return null;
}

function DeviceStateContent({
  state,
  onAddNewDevicePressed,
}: Readonly<{
  state: DeviceStateSheetState;
  /** Called before the waiting hint opens the Add mode. */
  onAddNewDevicePressed: () => void;
}>): React.ReactNode {
  const isNewDevice = useIsNewDevice();

  switch (state.type) {
    case ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice: {
      const { addNewDevice } = state;
      return (
        <>
          <TrackedWaitingForSelectedDeviceState device={state.device} />
          {state.showDeviceNotFound && (
            <WaitingHint
              onAddNewDevice={
                addNewDevice
                  ? () => {
                      onAddNewDevicePressed();
                      addNewDevice();
                    }
                  : undefined
              }
            />
          )}
        </>
      );
    }
    case ConnectKnownOrNewDeviceUIStateTypes.Connecting:
      return (
        <>
          <TrackedConnectingState device={state.device} isNewDevice={isNewDevice(state.device)} />
          <DeviceConnectingEvent device={state.device} />
        </>
      );
    default:
      return assertNever(state);
  }
}

export function DeviceStateSheet({ state }: Readonly<DeviceStateSheetProps>): React.JSX.Element {
  const trackingContext = useDeviceIntentTracking();
  const { sourceFlow, analyticsProperties } = trackingContext;
  // Set when the waiting hint opens the Add mode: the attempt goes on there, so its close is no outcome.
  const isAddingNewDeviceRef = useRef(false);
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  // Lumen's static preset can force Android dynamic sheets full height, so use the live window cap.
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={state !== null}
      onClose={() => {
        const isAddingNewDevice = isAddingNewDeviceRef.current;
        isAddingNewDeviceRef.current = false;
        // The sheet also reports a close once the state has left it: no outcome then.
        if (!state || isAddingNewDevice) return;
        trackDeviceflowCanceled({
          sourceFlow,
          extraProperties: analyticsProperties,
          failure: null,
        });
        state.close();
      }}
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
            {state && (
              <DeviceStateContent
                state={state}
                onAddNewDevicePressed={() => {
                  isAddingNewDeviceRef.current = true;
                }}
              />
            )}
          </Box>
        </DeviceIntentTrackingProvider>
      </BottomSheetScrollView>
    </QueuedBottomSheet>
  );
}
