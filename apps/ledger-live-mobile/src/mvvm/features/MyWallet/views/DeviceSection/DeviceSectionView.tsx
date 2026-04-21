import React from "react";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { type DeviceSectionDevice } from "./useDeviceSectionViewModel";
import { AddDeviceLink } from "./components/AddDeviceLink";
import { DeviceListContent } from "./components/DeviceListContent";

interface DeviceSectionViewProps {
  readonly devices: readonly DeviceSectionDevice[];
  readonly hasDevices: boolean;
  readonly onAddDevice: () => void;
}

export function DeviceSectionView({ devices, hasDevices, onAddDevice }: DeviceSectionViewProps) {
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
        <DeviceListContent devices={devices} onAddDevice={onAddDevice} />
      </Box>
    </Box>
  );
}
