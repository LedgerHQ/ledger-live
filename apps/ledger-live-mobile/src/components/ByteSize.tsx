import React from "react";
import { Trans } from "react-i18next";
import type { DeviceModel } from "@ledgerhq/types-devices";

const k = 1024; // 1kb unit

const sizes = ["bytes", "kbUnit", "mbUnit"];

/** formats a byte value into its correct size in kb or mb unit taking in account the device block size */
const ByteSize = ({
  value,
  deviceModel,
  decimals = 2,
  firmwareVersion,
  formatFunction,
}: {
  value?: number | null;
  deviceModel: DeviceModel;
  decimals?: number;
  firmwareVersion: string;
  formatFunction?: (_: number) => number;
}) => {
  if (!value) return <>{"-"}</>;
  const blockSize = deviceModel.getBlockSize(firmwareVersion);
  // FIXME it should be on live-common side
  const bytes = Math.ceil(value / blockSize) * blockSize;
  const i = Math.floor(Math.log(bytes) / Math.log(k)) || 1; // Nb no more bytes

  const rawSize = bytes / k ** i;
  const dm = rawSize < 1 ? 1 : i > 1 ? Math.max(0, decimals) : 0;
  const divider = 10 ** dm;
  const toFormat = rawSize * divider;
  let formattedSize = formatFunction ? formatFunction(toFormat) : toFormat;
  formattedSize /= divider;
  const size = formattedSize.toFixed(dm);
  return (
    <Trans
      i18nKey={`byteSize.${sizes[i]}`}
      values={{
        size,
      }}
    />
  );
};

export default ByteSize;
