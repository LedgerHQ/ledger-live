// @flow
import type { Observable } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import type { DeviceInfo } from "@ledgerhq/live-common/types/manager";
import { listApps } from "@ledgerhq/live-common/apps/hw";
import type { ListAppsEvent } from "@ledgerhq/live-common/apps/index";

type Input = {
  deviceInfo: DeviceInfo,
  deviceId: string,
};

const cmd = ({ deviceId, deviceInfo }: Input): Observable<ListAppsEvent> =>
  withDevice(deviceId)(transport => listApps(transport, deviceInfo));

cmd.inferSentryTransaction = ({ deviceInfo }) => ({
  data: deviceInfo,
});

export default cmd;
