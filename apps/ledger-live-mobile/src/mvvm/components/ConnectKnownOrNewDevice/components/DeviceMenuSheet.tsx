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
import type { SelectableDeviceListItem } from "@ledgerhq/live-dmk-mobile";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";

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
  const disconnect = item && "disconnect" in item ? item.disconnect : undefined;
  const remove = item?.remove;

  const runAndClose = (action: () => void) => () => {
    action();
    onClose();
  };

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={item !== null}
      onClose={onClose}
      enableDynamicSizing
      testID="connect-known-or-new-device-menu-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        {disconnect && (
          <ListItem
            onPress={runAndClose(disconnect)}
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
          <ListItem onPress={runAndClose(remove)} testID="connect-known-or-new-device-remove">
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
