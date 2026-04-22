import React from "react";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { type DeviceSectionDevice } from "./useDeviceSectionViewModel";
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
  readonly selectedDevice: DeviceSectionDevice | null;
  readonly isRemoveDrawerOpen: boolean;
  readonly onCloseRemoveMenu: () => void;
  readonly onRemoveDevice: () => void;
}

export function DeviceSectionView({
  devices,
  hasDevices,
  onAddDevice,
  onExploreDevices,
  onDevicePress,
  onOpenMenu,
  selectedDevice,
  isRemoveDrawerOpen,
  onCloseRemoveMenu,
  onRemoveDevice,
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
        device={selectedDevice}
        isOpen={isRemoveDrawerOpen}
        onClose={onCloseRemoveMenu}
        onRemove={onRemoveDevice}
      />
    </Box>
  );
}
