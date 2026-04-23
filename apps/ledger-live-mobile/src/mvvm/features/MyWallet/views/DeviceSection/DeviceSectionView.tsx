import React from "react";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Result } from "@ledgerhq/live-common/hw/actions/manager";
import { useTranslation } from "~/context/Locale";
import DeviceActionModal from "~/components/DeviceActionModal";
import { type DeviceSectionDevice, type DeviceSectionViewModel } from "./useDeviceSectionViewModel";
import { AddDeviceLink } from "./components/AddDeviceLink";
import { DeviceListContent } from "./components/DeviceListContent";
import { DeviceRemoveDrawer } from "./components/DeviceRemoveDrawer";

interface DeviceSectionViewProps {
  readonly devices: readonly DeviceSectionDevice[];
  readonly hasDevices: boolean;
  readonly onAddDevice: () => void;
  readonly onExploreDevices: () => void;
  readonly onDevicePress: (device: DeviceSectionDevice) => void;
  readonly onOpenMenu: (device: DeviceSectionDevice) => void;
  readonly deviceToRemove: DeviceSectionDevice | null;
  readonly isRemoveDrawerOpen: boolean;
  readonly onCloseRemoveMenu: () => void;
  readonly onRemoveDevice: () => void;
  readonly selectedDevice: Device | null;
  readonly managerAction: DeviceSectionViewModel["managerAction"];
  readonly onDeviceActionResult: (result: Result) => void;
  readonly onDeviceActionClose: () => void;
  readonly onDeviceActionError: (error: Error) => void;
}

export function DeviceSectionView({
  devices,
  hasDevices,
  onAddDevice,
  onExploreDevices,
  onDevicePress,
  onOpenMenu,
  deviceToRemove,
  isRemoveDrawerOpen,
  onCloseRemoveMenu,
  onRemoveDevice,
  selectedDevice,
  managerAction,
  onDeviceActionResult,
  onDeviceActionClose,
  onDeviceActionError,
}: DeviceSectionViewProps) {
  const { t } = useTranslation();

  return (
    <Box testID="my-wallet-device-section">
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s12" }}>
          <SubheaderTitle testID="my-wallet-device-section-title">
            {t("myWallet.deviceSection.title")}
          </SubheaderTitle>
          <Box lx={{ flex: 1 }} />
          {hasDevices && <AddDeviceLink onPress={onAddDevice} />}
        </SubheaderRow>
      </Subheader>

      <Box lx={{ gap: "s16" }}>
        <DeviceListContent
          devices={devices}
          onAddDevice={onAddDevice}
          onExploreDevices={onExploreDevices}
          onDevicePress={onDevicePress}
          onOpenMenu={onOpenMenu}
        />
      </Box>

      <DeviceRemoveDrawer
        device={deviceToRemove}
        isOpen={isRemoveDrawerOpen}
        onClose={onCloseRemoveMenu}
        onRemove={onRemoveDevice}
      />

      <DeviceActionModal
        device={selectedDevice}
        action={managerAction}
        request={null}
        onResult={onDeviceActionResult}
        onClose={onDeviceActionClose}
        onError={onDeviceActionError}
      />
    </Box>
  );
}
