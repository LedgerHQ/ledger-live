import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { Trash, Unlink } from "@ledgerhq/lumen-ui-rnative/symbols";
import { DeviceListItemStatuses, type SelectableDeviceListItem } from "@ledgerhq/live-dmk-mobile";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackDIEScreen } from "LLM/components/DeviceIntentExecutor/components/TrackDIEScreen";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  getTrackingTransport,
  trackDeviceActionButtonClicked,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { useTranslation } from "~/context/Locale";
import { DEVICE_LIST_BUTTON, PAGE_DEVICE_MENU } from "../utils/tracking";

/** The space under the last action in the design, the safe area included. */
const BOTTOM_PADDING = 24;

type DeviceMenuSheetProps = {
  /** The row whose menu is open, or `null`. */
  item: SelectableDeviceListItem | null;
  onClose: () => void;
};

export function DeviceMenuSheet({
  item,
  onClose,
}: Readonly<DeviceMenuSheetProps>): React.JSX.Element {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const disconnect =
    item?.status === DeviceListItemStatuses.Connected ? item.disconnect : undefined;
  const remove = item?.remove;

  const runAndClose = (button: string, action: () => void) => () => {
    if (item) {
      trackDeviceActionButtonClicked({
        sourceFlow,
        button,
        modelId: item.device.deviceModelId,
        extraProperties: { ...analyticsProperties, deviceStatus: item.status },
      });
    }
    action();
    onClose();
  };

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={item !== null}
      onClose={onClose}
      enableDynamicSizing
      contentHasBottomSpace
      testID="connect-known-or-new-device-menu-sheet"
    >
      <BottomSheetView style={{ paddingBottom: Math.max(bottomInset, BOTTOM_PADDING) }}>
        <BottomSheetHeader />
        {item && (
          <TrackDIEScreen
            category={PAGE_DEVICE_MENU}
            modelId={item.device.deviceModelId}
            transport={getTrackingTransport(item.device.transport)}
            deviceStatus={item.status}
            refreshSource
          />
        )}
        {disconnect && (
          <ListItem
            onPress={runAndClose(DEVICE_LIST_BUTTON.Disconnect, disconnect)}
            testID="connect-known-or-new-device-disconnect"
          >
            <ListItemLeading>
              <Unlink size={24} />
              <ListItemContent>
                <ListItemTitle>{t("connectKnownOrNewDevice.menu.disconnect")}</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        )}
        {remove && (
          <ListItem
            onPress={runAndClose(DEVICE_LIST_BUTTON.Remove, remove)}
            testID="connect-known-or-new-device-remove"
          >
            <ListItemLeading>
              <Trash size={24} color="error" />
              <ListItemContent>
                <ListItemTitle lx={{ color: "error" }}>
                  {t("connectKnownOrNewDevice.menu.remove")}
                </ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        )}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
