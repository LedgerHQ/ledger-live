import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  CLSSupportedDeviceModelId,
  supportedDeviceModelIds,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { Bar, Flex, Text } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

type Props = {
  deviceModelId: CLSSupportedDeviceModelId;
  onChange: (deviceModelId: CLSSupportedDeviceModelId) => void;
};

export default function DeviceModelPicker({ deviceModelId, onChange }: Props) {
  const supportDeviceEuropa = useFeature("supportDeviceEuropa")?.enabled;
  const supportedAndEnabledDeviceModelIds = supportedDeviceModelIds.filter(() => {
    const devicesSupported: Record<CLSSupportedDeviceModelId, boolean> = {
      [DeviceModelId.stax]: true,
      [DeviceModelId.europa]: Boolean(supportDeviceEuropa),
    };
    return devicesSupported[deviceModelId];
  }, [supportDeviceEuropa]);

  return (
    <Flex height={40}>
      <Bar
        initialActiveIndex={supportedAndEnabledDeviceModelIds.indexOf(deviceModelId)}
        onTabChange={i => {
          onChange(supportedAndEnabledDeviceModelIds[i]);
        }}
      >
        {supportedAndEnabledDeviceModelIds.map(deviceModelId => (
          <Text
            px={3}
            color="inherit"
            variant="paragraph"
            fontWeight="semiBold"
            key={deviceModelId}
          >
            {getDeviceModel(deviceModelId).productName}
          </Text>
        ))}
      </Bar>
    </Flex>
  );
}
