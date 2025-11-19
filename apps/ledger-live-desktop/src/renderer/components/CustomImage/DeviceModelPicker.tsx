import React from "react";
import { getDeviceModel, DeviceModelId } from "@ledgerhq/devices";
import {
  CLSSupportedDeviceModelId,
  supportedDeviceModelIds,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { Bar, Flex, Text, Icons } from "@ledgerhq/react-ui";

type Props = {
  deviceModelId: CLSSupportedDeviceModelId;
  onChange: (deviceModelId: CLSSupportedDeviceModelId) => void;
};

function DeviceIcon({ deviceModelId }: { deviceModelId: CLSSupportedDeviceModelId }) {
  switch (deviceModelId) {
    case DeviceModelId.stax:
      return <Icons.Stax size="M" />;
    case DeviceModelId.europa:
      return <Icons.Flex size="M" />;
    case DeviceModelId.apex:
      return <Icons.Apex size="M" />;
    default:
      return null;
  }
}

export default function DeviceModelPicker({
  deviceModelId: initialDeviceModelId,
  onChange,
}: Props) {
  return (
    <Flex height={40} justifyContent={"center"} alignItems="center">
      <Bar
        initialActiveIndex={supportedDeviceModelIds.indexOf(initialDeviceModelId)}
        onTabChange={i => {
          onChange(supportedDeviceModelIds[i]);
        }}
      >
        {supportedDeviceModelIds.map(deviceModelId => (
          <Flex
            width={170}
            justifyContent={"center"}
            alignItems="center"
            py={1}
            px={3}
            key={`settings-developer-debug-cls-${deviceModelId}`}
          >
            <DeviceIcon deviceModelId={deviceModelId} />
            <Text size="medium" alignSelf="center" color="inherit" ml={1}>
              {getDeviceModel(deviceModelId).productName}
            </Text>
          </Flex>
        ))}
      </Bar>
    </Flex>
  );
}
