import React from "react";
import { Trans } from "react-i18next";
import { DeviceModel } from "@ledgerhq/devices";
import { formatSize } from "@ledgerhq/live-common/apps/formatting";
const ByteSize = ({
  value,
  deviceModel,
  firmwareVersion,
}: {
  value: number;
  deviceModel: DeviceModel;
  firmwareVersion: string;
}) => {
  if (!value) return "–";
  const blockSize = deviceModel.getBlockSize(firmwareVersion);
  const [size, unit] = formatSize(value, blockSize);
  return (
    <Trans
      i18nKey={`byteSize.${unit}`}
      values={{
        size,
      }}
    />
  );
};
export default ByteSize;
