import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  CLSSupportedDeviceModelId,
  supportedDeviceModelIds,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { Bar, Flex, Text } from "@ledgerhq/react-ui";

type Props = {
  deviceModelId: CLSSupportedDeviceModelId;
  onChange: (deviceModelId: CLSSupportedDeviceModelId) => void;
};

export default function DeviceModelPicker({ deviceModelId, onChange }: Props) {
  return (
    <Flex height={40}>
      <Bar
        initialActiveIndex={supportedDeviceModelIds.indexOf(deviceModelId)}
        onTabChange={i => {
          onChange(supportedDeviceModelIds[i]);
        }}
      >
        {supportedDeviceModelIds.map(deviceModelId => (
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
