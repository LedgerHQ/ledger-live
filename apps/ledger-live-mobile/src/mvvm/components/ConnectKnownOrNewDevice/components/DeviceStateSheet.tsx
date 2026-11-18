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
import { ConnectingState, WaitingForSelectedDeviceState } from "LLM/components/DeviceConnection";
import { useTranslation } from "~/context/Locale";

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

  return (
    <Banner
      appearance="info"
      title={t("connectKnownOrNewDevice.waitingHint.title")}
      primaryAction={
        <Button
          appearance="gray"
          size="sm"
          disabled={!onAddNewDevice}
          onPress={onAddNewDevice}
          lx={{ flexShrink: 1 }}
        >
          {t("connectKnownOrNewDevice.addDevice")}
        </Button>
      }
    />
  );
}

export function DeviceStateSheet({ state }: Readonly<DeviceStateSheetProps>): React.JSX.Element {
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  // Lumen's static preset can force Android dynamic sheets full height, so use the live window cap.
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={state !== null}
      onClose={() => state?.close()}
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
        <Box lx={{ gap: "s16" }}>
          {state?.type === ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice && (
            <>
              <WaitingForSelectedDeviceState device={state.device} />
              {state.showDeviceNotFound && <WaitingHint onAddNewDevice={state.addNewDevice} />}
            </>
          )}
          {state?.type === ConnectKnownOrNewDeviceUIStateTypes.Connecting && <ConnectingState />}
        </Box>
      </BottomSheetScrollView>
    </QueuedBottomSheet>
  );
}
