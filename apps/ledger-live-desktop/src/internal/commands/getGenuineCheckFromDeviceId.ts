import {
  GetGenuineCheckFromDeviceIdArgs,
  GetGenuineCheckFromDeviceIdOutput,
  getGenuineCheckFromDeviceId,
} from "@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId";

// Makes getGenuineCheckFromDeviceId run on the internal thread
const cmd = (args: GetGenuineCheckFromDeviceIdArgs): GetGenuineCheckFromDeviceIdOutput =>
  getGenuineCheckFromDeviceId(args);

export default cmd;
