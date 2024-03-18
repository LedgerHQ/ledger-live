import React, { useMemo } from "react";
import styled from "styled-components";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { Flex } from "@ledgerhq/react-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { DeviceSelectorOption } from "./DeviceSelectorOption";
import DeviceIllustration from "~/renderer/components/DeviceIllustration";

const DeviceSelectContainer = styled(Flex).attrs({
  flexDirection: "row",
  alignItems: "stretch",
  width: "100%",
  height: "100%",
})``;

const allDevices = [
  {
    id: DeviceModelId.nanoS,
    enabled: true,
  },
  {
    id: DeviceModelId.nanoSP,
    enabled: true,
  },
  {
    id: DeviceModelId.nanoX,
    enabled: true,
  },
];
interface DeviceSelectorProps {
  onClick: (arg1: DeviceModelId) => void;
}

export function DeviceSelector({ onClick }: DeviceSelectorProps) {
  const deviceStaxSupported = useFeature("supportDeviceStax");
  const deviceEuropaSupported = useFeature("supportDeviceEuropa");

  const devices = useMemo(
    () => [
      ...(deviceStaxSupported?.enabled ? [{ id: DeviceModelId.stax, enabled: true }] : []),
      ...(deviceEuropaSupported?.enabled ? [{ id: DeviceModelId.europa, enabled: true }] : []),
      ...allDevices,
    ],
    [deviceStaxSupported, deviceEuropaSupported],
  );

  return (
    <DeviceSelectContainer>
      {devices.map(({ id, enabled }, index, arr) => (
        <DeviceSelectorOption
          id={`device-${id}`}
          key={id}
          label={getDeviceModel(id as DeviceModelId).productName}
          Illu={<DeviceIllustration deviceId={id as DeviceModelId} />}
          onClick={() => enabled && onClick(id as DeviceModelId)}
          isFirst={index === 0}
          isLast={index === arr.length - 1}
        />
      ))}
    </DeviceSelectContainer>
  );
}
