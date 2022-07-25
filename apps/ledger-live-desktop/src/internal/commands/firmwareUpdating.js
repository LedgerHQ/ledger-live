// @flow

import type { Observable } from "rxjs";
import { from } from "rxjs";
import { withDevicePolling } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import type { DeviceInfo } from "@ledgerhq/live-common/types/manager";

type Input = {
  deviceId: string,
};

type Result = DeviceInfo;

const cmd = ({ deviceId }: Input): Observable<Result> =>
  withDevicePolling(deviceId)(
    transport => from(getDeviceInfo(transport)),
    () => true, // accept all errors. we're waiting forever condition that make getDeviceInfo work
  );

cmd.inferSentryTransaction = () => ({});

export default cmd;
