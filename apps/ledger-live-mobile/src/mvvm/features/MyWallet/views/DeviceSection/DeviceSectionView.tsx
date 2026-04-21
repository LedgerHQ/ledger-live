import React from "react";
import { Box, Link, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { PlusCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { type DeviceSectionDevice } from "./useDeviceSectionViewModel";
import { DeviceListItem } from "./components/DeviceListItem";
import { ExploreDevicesItem } from "./components/ExploreDevicesItem";

interface DeviceSectionViewProps {
  readonly devices: readonly DeviceSectionDevice[];
}

export function DeviceSectionView({ devices }: DeviceSectionViewProps) {
  const { t } = useTranslation();

  return (
    <Box testID="my-wallet-device-section">
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s12" }}>
          <SubheaderTitle testID="my-wallet-device-section-title">
            {t("myWallet.deviceSection.title")}
          </SubheaderTitle>
          <Box lx={{ flex: 1 }} />
          <Box
            lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}
            testID="my-wallet-device-section-add"
          >
            <Link appearance="accent" size="md" underline={false}>
              {t("myWallet.deviceSection.add")}
            </Link>
            <PlusCircleFill size={20} color="interactive" />
          </Box>
        </SubheaderRow>
      </Subheader>

      <Box lx={{ gap: "s16" }}>
        <Box lx={{ backgroundColor: "surface", borderRadius: "md" }}>
          {devices.map(device => (
            <DeviceListItem key={device.id} device={device} />
          ))}
        </Box>
        <ExploreDevicesItem />
      </Box>
    </Box>
  );
}
