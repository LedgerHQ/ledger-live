import {
  GetLatestAvailableFirmwareFromDeviceIdArgs,
  GetLatestAvailableFirmwareFromDeviceIdOutput,
  getLatestAvailableFirmwareFromDeviceId,
} from "@ledgerhq/live-common/hw/getLatestAvailableFirmwareFromDeviceId";

// Makes getLatestAvailableFirmwareFromDeviceId run on the internal thread
const cmd = (
  args: GetLatestAvailableFirmwareFromDeviceIdArgs,
): GetLatestAvailableFirmwareFromDeviceIdOutput => getLatestAvailableFirmwareFromDeviceId(args);

export default cmd;
