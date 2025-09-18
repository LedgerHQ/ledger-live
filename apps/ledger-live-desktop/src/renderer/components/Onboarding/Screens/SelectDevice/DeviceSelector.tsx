import React from "react";
import styled from "styled-components";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { Flex } from "@ledgerhq/react-ui";
import { DeviceSelectorOption } from "./DeviceSelectorOption";
import DeviceIllustration from "~/renderer/components/DeviceIllustration";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

const DeviceSelectContainer = styled(Flex).attrs({
  flexDirection: "row",
  alignItems: "stretch",
  width: "100%",
  height: "100%",
})``;

type DeviceSelectorProps = {
  onClick(deviceModelId: DeviceModelId): void;
};

export function DeviceSelector({ onClick }: DeviceSelectorProps) {
  const isApexSupported = useFeature("supportDeviceApex")?.enabled ?? false;
  const allDevicesModelIds: DeviceModelId[] = [
    DeviceModelId.stax,
    DeviceModelId.europa,
    ...(isApexSupported ? [DeviceModelId.apex] : []),
    DeviceModelId.nanoS,
    DeviceModelId.nanoSP,
    DeviceModelId.nanoX,
  ];
  return (
    <DeviceSelectContainer>
      {allDevicesModelIds.map((deviceModelId, index, arr) => (
        <DeviceSelectorOption
          id={`device-${deviceModelId}`}
          key={deviceModelId}
          label={getDeviceModel(deviceModelId).productName}
          illustration={<DeviceIllustration deviceId={deviceModelId} />}
          onClick={() => onClick(deviceModelId)}
          isFirst={index === 0}
          isLast={index === arr.length - 1}
        />
      ))}
    </DeviceSelectContainer>
  );
}
