import React from "react";
import styled from "styled-components";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { Flex } from "@ledgerhq/react-ui";
import { DeviceSelectorOption } from "./DeviceSelectorOption";
import DeviceIllustration from "~/renderer/components/DeviceIllustration";

const DeviceSelectContainer = styled(Flex).attrs({
  flexDirection: "row",
  alignItems: "stretch",
  width: "100%",
  height: "100%",
})``;

const allDevicesModelIds = [
  DeviceModelId.stax,
  DeviceModelId.europa,
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
];

interface DeviceSelectorProps {
  onClick: (arg1: DeviceModelId) => void;
}

export function DeviceSelector({ onClick }: DeviceSelectorProps) {
  return (
    <DeviceSelectContainer>
      {allDevicesModelIds.map((deviceModelId, index, arr) => (
        <DeviceSelectorOption
          id={`device-${deviceModelId}`}
          key={deviceModelId}
          label={getDeviceModel(deviceModelId).productName}
          Illu={<DeviceIllustration deviceId={deviceModelId as DeviceModelId} />}
          onClick={() => onClick(deviceModelId as DeviceModelId)}
          isFirst={index === 0}
          isLast={index === arr.length - 1}
        />
      ))}
    </DeviceSelectContainer>
  );
}
