import React from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
} from "@ledgerhq/lumen-ui-rnative";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  type ConnectKnownOrNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
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

function WaitingHint({ onAddNewDevice }: Readonly<{ onAddNewDevice: () => void }>) {
  const { t } = useTranslation();

  return (
    <Banner
      appearance="info"
      title={t("connectKnownOrNewDevice.waitingHint.title")}
      primaryAction={
        <Button appearance="gray" size="sm" onPress={onAddNewDevice} lx={{ flexShrink: 1 }}>
          {t("connectKnownOrNewDevice.addDevice")}
        </Button>
      }
    />
  );
}

export function DeviceStateSheet({ state }: Readonly<DeviceStateSheetProps>): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={state !== null}
      onClose={() => state?.close()}
      enableDynamicSizing
      testID="connect-known-or-new-device-state-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16", gap: "s16" }}>
          {state?.type === ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice && (
            <>
              <WaitingForSelectedDeviceState device={state.device} />
              {state.showDeviceNotFound && <WaitingHint onAddNewDevice={state.addNewDevice} />}
            </>
          )}
          {state?.type === ConnectKnownOrNewDeviceUIStateTypes.Connecting && <ConnectingState />}
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
