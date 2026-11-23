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
  useIsNewDevice,
} from "LLM/components/DeviceConnection";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  trackConnectDeviceButtonClicked,
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

function DeviceStateContent({
  state,
}: Readonly<{ state: DeviceStateSheetState }>): React.ReactNode {
  const isNewDevice = useIsNewDevice();

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
        <TrackedConnectingState device={state.device} isNewDevice={isNewDevice(state.device)} />
      );
    default:
      return assertNever(state);
  }
}

export function DeviceStateSheet({ state }: Readonly<DeviceStateSheetProps>): React.JSX.Element {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  // Lumen's static preset can force Android dynamic sheets full height, so use the live window cap.
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={state !== null}
      onClose={() => {
        // The sheet also reports a close once the state has left it: no outcome then.
        if (!state) return;
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
        <Box lx={{ gap: "s16" }}>{state && <DeviceStateContent state={state} />}</Box>
      </BottomSheetScrollView>
    </QueuedBottomSheet>
  );
}
