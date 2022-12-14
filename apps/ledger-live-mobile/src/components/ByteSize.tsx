import React from "react";
import { Trans } from "react-i18next";
import type { DeviceModel } from "@ledgerhq/types-devices";
import { formatSize } from "@ledgerhq/live-common/apps/formatting";

const ByteSize = ({
  value,
  deviceModel,
  firmwareVersion,
}: {
  value?: number | null;
  deviceModel: DeviceModel;
  firmwareVersion: string;
}) => {
  if (!value) return <>{"-"}</>;
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
