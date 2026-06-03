import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
  Tag,
} from "@ledgerhq/lumen-ui-rnative";
import type { DisplayedDevice } from "@ledgerhq/live-dmk-mobile";
import { getDeviceSymbolByModelId } from "LLM/utils/getDeviceIcon";
import { useTranslation } from "~/context/Locale";
import { useSourceFlow } from "../../utils/SourceFlowContext";
import { trackDeviceSelected } from "../../utils/trackDeviceIntent";

type DeviceListItemProps = {
  device: DisplayedDevice;
};

function getDeviceName(device: DisplayedDevice["knownDevice"], fallbackName: string): string {
  return device.name ?? fallbackName;
}

export function DeviceListItem({ device }: Readonly<DeviceListItemProps>): React.ReactNode {
  const { t } = useTranslation();
  const sourceFlow = useSourceFlow();
  const DeviceIcon = getDeviceSymbolByModelId(device.knownDevice.deviceModelId);
  const isAvailable = device.type === "available";
  const handleSelect = () => {
    trackDeviceSelected({ sourceFlow, device: device.knownDevice });
    device.onSelect();
  };

  return (
    <ListItem onPress={handleSelect}>
      <ListItemLeading>
        <Spot size={48} appearance="icon" icon={DeviceIcon} />
        <ListItemContent>
          <ListItemTitle typography="body2SemiBold">
            {getDeviceName(
              device.knownDevice,
              t("deviceIntentExecutor.connectDevice.common.ledgerDevice"),
            )}
          </ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Tag
          appearance={isAvailable ? "accent-subtle" : "gray"}
          label={t(
            isAvailable
              ? "deviceIntentExecutor.connectDevice.common.available"
              : "deviceIntentExecutor.connectDevice.common.notConnected",
          )}
          size="md"
        />
      </ListItemTrailing>
    </ListItem>
  );
}
